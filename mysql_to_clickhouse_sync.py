#!/usr/bin/env python3
"""
MySQL to ClickHouse data synchronization script for order and order_item tables
"""

import mysql.connector
import requests
from datetime import datetime
import json
from typing import List, Dict, Any
import sys

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

def execute_clickhouse_query(query: str) -> Dict[str, Any]:
    """Execute a query on ClickHouse"""
    response = requests.post(
        CLICKHOUSE_CONFIG['url'],
        data=query,
        auth=(CLICKHOUSE_CONFIG['user'], CLICKHOUSE_CONFIG['password']),
        headers={'Content-Type': 'text/plain'},
        params={'database': 'default'}
    )
    
    if response.status_code != 200:
        raise Exception(f"ClickHouse query failed: {response.text}")
    
    return {
        'status': 'success',
        'data': response.text
    }

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
    
    # Build column definitions
    column_defs = []
    primary_key = None
    
    for col in columns:
        col_def = f"`{col['name']}` {col['clickhouse_type']}"
        
        # Add nullable if needed
        if col['nullable'] and col['clickhouse_type'] not in ['DateTime']:
            col_def = f"`{col['name']}` Nullable({col['clickhouse_type']})"
        
        column_defs.append(col_def)
        
        # Identify primary key
        if col['key'] == 'PRI':
            primary_key = col['name']
    
    # Create table query
    create_query = f"""
    CREATE TABLE {table_name} (
        {', '.join(column_defs)}
    ) ENGINE = ReplacingMergeTree()
    """
    
    # Add primary key if exists
    if primary_key:
        create_query += f" ORDER BY {primary_key}"
    else:
        # Use the first column as ordering key if no primary key
        create_query += f" ORDER BY {columns[0]['name']}"
    
    execute_clickhouse_query(create_query)
    print(f"Table {table_name} created successfully")

def sync_data(table_name: str, batch_size: int = 10000) -> None:
    """Sync data from MySQL to ClickHouse"""
    print(f"Starting data sync for table: {table_name}")
    
    # Get MySQL connection
    conn = mysql.connector.connect(**MYSQL_CONFIG)
    cursor = conn.cursor(dictionary=True)
    
    # Count total records
    count_query = f"SELECT COUNT(*) as total FROM `{table_name}`"
    cursor.execute(count_query)
    total_records = cursor.fetchone()['total']
    print(f"Total records to sync: {total_records}")
    
    # Sync data in batches
    offset = 0
    synced_records = 0
    
    while offset < total_records:
        # Fetch batch from MySQL
        select_query = f"SELECT * FROM `{table_name}` LIMIT {batch_size} OFFSET {offset}"
        cursor.execute(select_query)
        records = cursor.fetchall()
        
        if not records:
            break
        
        # Prepare data for ClickHouse insertion
        # Convert None values and datetime objects to appropriate formats
        processed_records = []
        for record in records:
            processed_record = {}
            for key, value in record.items():
                if value is None:
                    processed_record[key] = '\\N'  # ClickHouse NULL representation
                elif isinstance(value, datetime):
                    processed_record[key] = value.strftime('%Y-%m-%d %H:%M:%S')
                else:
                    processed_record[key] = str(value)
            processed_records.append(processed_record)
        
        # Build INSERT query for ClickHouse
        if processed_records:
            # Get column names
            columns = list(processed_records[0].keys())
            column_names = ', '.join([f"`{col}`" for col in columns])
            
            # Build values
            values_rows = []
            for record in processed_records:
                values = []
                for col in columns:
                    val = record[col]
                    if val == '\\N':
                        values.append('NULL')
                    else:
                        # Escape single quotes
                        val_escaped = val.replace("'", "\\'")
                        values.append(f"'{val_escaped}'")
                values_rows.append(f"({', '.join(values)})")
            
            insert_query = f"INSERT INTO {table_name} ({column_names}) VALUES {', '.join(values_rows)}"
            
            # Execute insert
            try:
                execute_clickhouse_query(insert_query)
                synced_records += len(records)
                print(f"Synced {synced_records}/{total_records} records ({synced_records/total_records*100:.1f}%)")
            except Exception as e:
                print(f"Error inserting batch: {e}")
                # You might want to log the failed batch or implement retry logic
                raise
        
        offset += batch_size
    
    cursor.close()
    conn.close()
    
    print(f"Data sync completed for {table_name}. Total records synced: {synced_records}")

def main():
    """Main function to orchestrate the sync process"""
    tables_to_sync = ['order', 'order_item']
    
    try:
        for table_name in tables_to_sync:
            print(f"\n{'='*50}")
            print(f"Processing table: {table_name}")
            print(f"{'='*50}")
            
            # Get table structure from MySQL
            columns = get_mysql_table_structure(table_name)
            print(f"Retrieved table structure with {len(columns)} columns")
            
            # Create table in ClickHouse
            create_clickhouse_table(table_name, columns)
            
            # Sync data
            sync_data(table_name)
            
            # Verify sync
            result = execute_clickhouse_query(f"SELECT COUNT(*) FROM {table_name}")
            print(f"Verification: {result['data'].strip()} records in ClickHouse table {table_name}")
        
        print(f"\n{'='*50}")
        print("All tables synced successfully!")
        print(f"{'='*50}")
        
    except Exception as e:
        print(f"Error during sync: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()