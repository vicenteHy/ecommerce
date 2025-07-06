#!/usr/bin/env python3
"""
Final version of MySQL to ClickHouse data synchronization script for order and order_item tables
"""

import mysql.connector
import requests
from datetime import datetime
import json
from typing import List, Dict, Any
import sys
import time
import ssl
import urllib3

# Disable SSL warnings for development (not recommended for production)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# MySQL connection configuration
MYSQL_CONFIG = {
    'host': '13.245.18.173',
    'port': 3307,
    'user': 'root',
    'password': 'Kajx5gtk3Y1GzQA55wez',
    'database': 'product_db'
}

# ClickHouse connection configuration
CLICKHOUSE_CONFIG = {
    'url': 'https://lswjb6rwql.ap-southeast-1.aws.clickhouse.cloud:8443',
    'user': 'default',
    'password': 'cC7SDO2nw2S_n'
}

# MySQL to ClickHouse data type mapping
def map_mysql_to_clickhouse_type(mysql_type: str) -> str:
    """Map MySQL data types to ClickHouse data types"""
    mysql_type_lower = mysql_type.lower()
    
    if 'bigint unsigned' in mysql_type_lower:
        return 'UInt64'
    elif 'bigint' in mysql_type_lower:
        return 'Int64'
    elif 'int unsigned' in mysql_type_lower:
        return 'UInt32'
    elif 'int' in mysql_type_lower:
        return 'Int32'
    elif 'tinyint(1)' in mysql_type_lower:
        return 'UInt8'  # Boolean
    elif 'tinyint' in mysql_type_lower:
        return 'UInt8'
    elif 'varchar' in mysql_type_lower:
        return 'String'
    elif 'text' in mysql_type_lower:
        return 'String'
    elif 'decimal' in mysql_type_lower:
        # Extract precision and scale
        import re
        match = re.search(r'decimal\((\d+),(\d+)\)', mysql_type_lower)
        if match:
            precision, scale = match.groups()
            if int(precision) <= 18:
                return f'Decimal64({scale})'
            elif int(precision) <= 38:
                return f'Decimal128({scale})'
            else:
                return f'Decimal256({scale})'
        return 'Decimal64(2)'
    elif 'datetime' in mysql_type_lower:
        return 'DateTime'
    elif 'date' in mysql_type_lower:
        return 'Date'
    else:
        return 'String'  # Default fallback

def execute_clickhouse_query(query: str, data: str = None) -> Dict[str, Any]:
    """Execute a query on ClickHouse with SSL handling"""
    # Create a session with SSL configuration
    session = requests.Session()
    
    try:
        if data is not None:
            # For INSERT queries with data
            response = session.post(
                CLICKHOUSE_CONFIG['url'],
                params={
                    'database': 'default',
                    'query': query
                },
                data=data.encode('utf-8'),
                auth=(CLICKHOUSE_CONFIG['user'], CLICKHOUSE_CONFIG['password']),
                headers={'Content-Type': 'text/tab-separated-values'},
                timeout=60,
                verify=False  # Disable SSL verification due to SSL issues
            )
        else:
            # For regular queries
            response = session.post(
                CLICKHOUSE_CONFIG['url'],
                data=query,
                auth=(CLICKHOUSE_CONFIG['user'], CLICKHOUSE_CONFIG['password']),
                headers={'Content-Type': 'text/plain'},
                params={'database': 'default'},
                timeout=300,
                verify=False  # Disable SSL verification due to SSL issues
            )
        
        if response.status_code != 200:
            raise Exception(f"ClickHouse query failed: {response.text}")
        
        return {
            'status': 'success',
            'data': response.text
        }
    finally:
        session.close()

def get_mysql_table_structure(table_name: str) -> List[Dict[str, str]]:
    """Get table structure from MySQL"""
    conn = mysql.connector.connect(**MYSQL_CONFIG)
    cursor = conn.cursor(dictionary=True)
    
    # Escape table name with backticks
    query = f"DESCRIBE `{table_name}`"
    cursor.execute(query)
    
    columns = []
    for row in cursor.fetchall():
        columns.append({
            'name': row['Field'],
            'mysql_type': row['Type'],
            'clickhouse_type': map_mysql_to_clickhouse_type(row['Type']),
            'nullable': row['Null'] == 'YES',
            'key': row['Key'],
            'default': row['Default']
        })
    
    cursor.close()
    conn.close()
    
    return columns

def create_clickhouse_table(table_name: str, columns: List[Dict[str, str]]) -> None:
    """Create table in ClickHouse"""
    print(f"Creating ClickHouse table: {table_name}")
    
    # Drop table if exists
    drop_query = f"DROP TABLE IF EXISTS {table_name}"
    execute_clickhouse_query(drop_query)
    print(f"  Dropped existing table if any")
    
    # Build column definitions
    column_defs = []
    primary_key = None
    
    for col in columns:
        col_def = f"`{col['name']}` {col['clickhouse_type']}"
        
        # Add nullable if needed (but not for primary keys)
        if col['nullable'] and col['key'] != 'PRI':
            col_def = f"`{col['name']}` Nullable({col['clickhouse_type']})"
        
        column_defs.append(col_def)
        
        # Identify primary key
        if col['key'] == 'PRI':
            primary_key = col['name']
    
    # Create table query
    create_query = f"""
    CREATE TABLE {table_name} (
        {', '.join(column_defs)}
    ) ENGINE = MergeTree()
    """
    
    # Add primary key if exists
    if primary_key:
        create_query += f" ORDER BY `{primary_key}`"
    else:
        # Use the first column as ordering key if no primary key
        create_query += f" ORDER BY `{columns[0]['name']}`"
    
    execute_clickhouse_query(create_query)
    print(f"  Table {table_name} created successfully")

def format_value_for_clickhouse(value: Any, col_type: str) -> str:
    """Format a value for ClickHouse TabSeparated format"""
    if value is None:
        return '\\N'
    elif isinstance(value, datetime):
        return value.strftime('%Y-%m-%d %H:%M:%S')
    elif isinstance(value, str):
        # Escape special characters for TabSeparated format
        return value.replace('\\', '\\\\').replace('\t', '\\t').replace('\n', '\\n').replace('\r', '\\r')
    else:
        return str(value)

def sync_data_optimized(table_name: str, batch_size: int = 500) -> None:
    """Optimized sync data from MySQL to ClickHouse using TabSeparated format"""
    print(f"\nStarting data sync for table: {table_name}")
    
    # Get MySQL connection
    conn = mysql.connector.connect(**MYSQL_CONFIG)
    cursor = conn.cursor(dictionary=True)
    
    # Count total records
    count_query = f"SELECT COUNT(*) as total FROM `{table_name}`"
    cursor.execute(count_query)
    total_records = cursor.fetchone()['total']
    print(f"  Total records to sync: {total_records}")
    
    if total_records == 0:
        print(f"  No records to sync for {table_name}")
        cursor.close()
        conn.close()
        return
    
    # Get column information
    columns_info = get_mysql_table_structure(table_name)
    column_names = [col['name'] for col in columns_info]
    
    # Sync data in batches
    offset = 0
    synced_records = 0
    start_time = time.time()
    errors = 0
    
    while offset < total_records:
        batch_start_time = time.time()
        
        try:
            # Fetch batch from MySQL
            select_query = f"SELECT * FROM `{table_name}` ORDER BY `{columns_info[0]['name']}` LIMIT {batch_size} OFFSET {offset}"
            cursor.execute(select_query)
            records = cursor.fetchall()
            
            if not records:
                break
            
            # Prepare data in TabSeparated format
            tsv_lines = []
            for record in records:
                values = []
                for col_info in columns_info:
                    col_name = col_info['name']
                    value = record.get(col_name)
                    formatted_value = format_value_for_clickhouse(value, col_info['clickhouse_type'])
                    values.append(formatted_value)
                tsv_lines.append('\t'.join(values))
            
            tsv_data = '\n'.join(tsv_lines)
            
            # Build INSERT query with TabSeparated format
            column_names_str = ', '.join([f"`{col}`" for col in column_names])
            insert_query = f"INSERT INTO {table_name} ({column_names_str}) FORMAT TabSeparated"
            
            # Execute insert
            result = execute_clickhouse_query(insert_query, tsv_data)
            
            synced_records += len(records)
            
            # Calculate progress and ETA
            elapsed_time = time.time() - start_time
            records_per_second = synced_records / elapsed_time if elapsed_time > 0 else 0
            remaining_records = total_records - synced_records
            eta_seconds = remaining_records / records_per_second if records_per_second > 0 else 0
            
            batch_time = time.time() - batch_start_time
            print(f"  Progress: {synced_records}/{total_records} ({synced_records/total_records*100:.1f}%) "
                  f"- Batch: {batch_time:.2f}s - Speed: {records_per_second:.0f} rec/s - ETA: {eta_seconds:.0f}s")
                  
        except Exception as e:
            errors += 1
            print(f"  ⚠️ Error in batch at offset {offset}: {str(e)[:100]}")
            if errors > 5:
                print(f"  ❌ Too many errors, aborting sync for {table_name}")
                raise
            # Continue with next batch
        
        offset += batch_size
    
    cursor.close()
    conn.close()
    
    total_time = time.time() - start_time
    print(f"  ✅ Sync completed: {synced_records} records in {total_time:.2f}s ({synced_records/total_time:.0f} rec/s)")

def verify_sync(table_name: str) -> bool:
    """Verify the sync by comparing counts"""
    # Get MySQL count
    conn = mysql.connector.connect(**MYSQL_CONFIG)
    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
    mysql_count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    
    # Get ClickHouse count
    result = execute_clickhouse_query(f"SELECT COUNT(*) as cnt FROM {table_name}")
    clickhouse_count = int(result['data'].strip())
    
    print(f"\nVerification for {table_name}:")
    print(f"  MySQL records: {mysql_count}")
    print(f"  ClickHouse records: {clickhouse_count}")
    
    if mysql_count == clickhouse_count:
        print(f"  ✅ Counts match!")
        return True
    else:
        print(f"  ⚠️ Count mismatch! Difference: {mysql_count - clickhouse_count}")
        return False

def main():
    """Main function to orchestrate the sync process"""
    tables_to_sync = ['order', 'order_item']
    
    print("="*70)
    print("MySQL to ClickHouse Data Synchronization")
    print("="*70)
    print(f"Tables to sync: {', '.join(tables_to_sync)}")
    print()
    
    try:
        overall_start_time = time.time()
        successful_tables = []
        failed_tables = []
        
        for table_name in tables_to_sync:
            print(f"\n{'='*70}")
            print(f"Processing table: {table_name}")
            print(f"{'='*70}")
            
            table_start_time = time.time()
            
            try:
                # Get table structure from MySQL
                columns = get_mysql_table_structure(table_name)
                print(f"  Retrieved {len(columns)} columns from MySQL")
                
                # Create table in ClickHouse
                create_clickhouse_table(table_name, columns)
                
                # Sync data with optimized method
                sync_data_optimized(table_name)
                
                # Verify sync
                if verify_sync(table_name):
                    successful_tables.append(table_name)
                else:
                    failed_tables.append(table_name)
                
                table_time = time.time() - table_start_time
                print(f"\nTable {table_name} completed in {table_time:.2f} seconds")
                
            except Exception as e:
                print(f"\n❌ Failed to sync table {table_name}: {str(e)}")
                failed_tables.append(table_name)
                import traceback
                traceback.print_exc()
        
        overall_time = time.time() - overall_start_time
        
        print(f"\n{'='*70}")
        print("SYNC SUMMARY")
        print(f"{'='*70}")
        print(f"Total time: {overall_time:.2f} seconds")
        print(f"Successful tables: {', '.join(successful_tables) if successful_tables else 'None'}")
        print(f"Failed tables: {', '.join(failed_tables) if failed_tables else 'None'}")
        
        if failed_tables:
            print("\n⚠️ Some tables failed to sync properly!")
            sys.exit(1)
        else:
            print("\n✅ All tables synced successfully!")
        
    except Exception as e:
        print(f"\n❌ Critical error during sync: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()