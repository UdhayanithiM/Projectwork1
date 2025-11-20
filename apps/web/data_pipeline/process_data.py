# process_data.py (Version 2)

import pandas as pd
import json

# --- CONFIGURATION ---
INPUT_CSV_PATH = 'Software Questions.csv'
OUTPUT_JSONL_PATH = 'processed_questions.jsonl'

def process_csv_to_jsonl():
    """
    Reads the raw CSV data, converts it into a structured format for the AI,
    and saves it as a .jsonl file.
    """
    print(f"Starting to process {INPUT_CSV_PATH}...")

    try:
        # --- Step 1: Read the CSV file with the CORRECT ENCODING ---
        # THIS IS THE LINE WE CHANGED. We added encoding='latin1'.
        df = pd.read_csv(INPUT_CSV_PATH, encoding='latin1')
        
        print(f"Successfully loaded {len(df)} rows from the CSV.")
    except FileNotFoundError:
        print(f"ERROR: The file '{INPUT_CSV_PATH}' was not found. Please make sure it's in the 'data_pipeline' folder.")
        return
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")
        return

    # --- Step 2: Process each row and create the structured format ---
    with open(OUTPUT_JSONL_PATH, 'w') as output_file:
        for index, row in df.iterrows():
            question = row['Question']
            answer = row['Answer']

            if not isinstance(question, str) or not isinstance(answer, str):
                continue

            record = {
                "messages": [
                    {
                        "role": "system",
                        "content": "You are FortiTwin, an expert AI interviewer assessing a candidate."
                    },
                    {
                        "role": "user",
                        "content": question
                    },
                    {
                        "role": "assistant",
                        "content": answer
                    }
                ]
            }

            output_file.write(json.dumps(record) + '\n')

    print(f"Processing complete. The structured data has been saved to '{OUTPUT_JSONL_PATH}'.")

if __name__ == "__main__":
    process_csv_to_jsonl()