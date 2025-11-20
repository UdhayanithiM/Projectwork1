# split_data.py

import json
import random

# --- CONFIGURATION ---
INPUT_FILE = 'processed_questions.jsonl'
TRAIN_FILE = 'train_dataset.jsonl'
VALIDATION_FILE = 'validation_dataset.jsonl'
TEST_FILE = 'test_dataset.jsonl'

# We will split the data 80% for training, 10% for validation, and 10% for testing.
SPLIT_RATIOS = [0.8, 0.1, 0.1]

def split_dataset():
    """
    Reads the processed data and splits it into training, validation,
    and testing sets.
    """
    print(f"Reading data from {INPUT_FILE}...")
    
    # --- Step 1: Read all the data from our processed file ---
    try:
        with open(INPUT_FILE, 'r') as f:
            # Read every line from the file into a list.
            all_data = [json.loads(line) for line in f]
        print(f"Found {len(all_data)} records to split.")
    except FileNotFoundError:
        print(f"ERROR: The file '{INPUT_FILE}' was not found. Make sure it's in the 'data_pipeline' folder.")
        return

    # --- Step 2: Shuffle the data randomly ---
    # Shuffling is important to make sure our training and test sets are not biased.
    random.shuffle(all_data)

    # --- Step 3: Calculate the split points ---
    total_records = len(all_data)
    train_end = int(total_records * SPLIT_RATIOS[0])
    validation_end = train_end + int(total_records * SPLIT_RATIOS[1])

    # --- Step 4: Create the three separate lists of data ---
    train_data = all_data[:train_end]
    validation_data = all_data[train_end:validation_end]
    test_data = all_data[validation_end:]

    print(f"Splitting into: {len(train_data)} training, {len(validation_data)} validation, and {len(test_data)} testing records.")

    # --- Step 5: Write each list to its own new file ---
    def write_to_file(filename, data):
        with open(filename, 'w') as f:
            for record in data:
                f.write(json.dumps(record) + '\n')

    write_to_file(TRAIN_FILE, train_data)
    write_to_file(VALIDATION_FILE, validation_data)
    write_to_file(TEST_FILE, test_data)

    print("Successfully created train, validation, and test dataset files.")

# --- This makes the script runnable ---
if __name__ == "__main__":
    split_dataset()