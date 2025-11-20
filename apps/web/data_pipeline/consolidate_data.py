import pandas as pd
import json

print("--- Starting Data Consolidation and Formatting ---")

# List of your dataset files
files = [
    'Software Questions.csv',
    'Generated_Interview_Questions.csv',
    'Software_Questions_Extended.csv'
]

all_data = []

# Read and process each file
for file in files:
    try:
        # Note: We are ignoring potential bad lines to handle formatting errors
        df = pd.read_csv(file, on_bad_lines='skip')

        # Identify question and answer columns (they might have different names)
        question_col = 'Question'
        answer_col = 'Answer'

        # Simple check if the columns exist, if not try other common names
        if question_col not in df.columns:
            # Add alternative column names you might find in your files
            possible_q_cols = ['question', 'Questions'] 
            for col in possible_q_cols:
                if col in df.columns:
                    question_col = col
                    break

        if answer_col not in df.columns:
            possible_a_cols = ['answer', 'Answers']
            for col in possible_a_cols:
                if col in df.columns:
                    answer_col = col
                    break

        if question_col in df.columns and answer_col in df.columns:
            # Drop rows where either question or answer is missing
            df.dropna(subset=[question_col, answer_col], inplace=True)
            all_data.append(df[[question_col, answer_col]])
            print(f"✅ Successfully processed '{file}'")
        else:
            print(f"⚠️  Could not find required columns in '{file}'. Skipping.")

    except Exception as e:
        print(f"❌ Error processing '{file}': {e}")

# Combine all dataframes into one
if not all_data:
    print("❌ No data was loaded. Please check your file paths and column names.")
else:
    combined_df = pd.concat(all_data, ignore_index=True)

    # Rename columns to a standard format
    combined_df.columns = ['question', 'answer']

    # Remove duplicate questions to ensure a clean dataset
    initial_rows = len(combined_df)
    combined_df.drop_duplicates(subset=['question'], inplace=True)
    final_rows = len(combined_df)
    print(f"\nRemoved {initial_rows - final_rows} duplicate questions.")

    # Format the data into the required JSONL format for fine-tuning
    # This format is specifically for instruction-based models
    output_file = 'interview_dataset.jsonl'
    with open(output_file, 'w') as f:
        for _, row in combined_df.iterrows():
            # The format includes a system prompt, a user question, and the assistant's answer
            formatted_entry = {
                "messages": [
                    {"role": "system", "content": "You are an expert technical interviewer. Ask questions clearly and concisely."},
                    {"role": "user", "content": str(row['question'])},
                    {"role": "assistant", "content": str(row['answer'])}
                ]
            }
            f.write(json.dumps(formatted_entry) + '\n')

    print(f"\n✅ Successfully created the final dataset at '{output_file}' with {final_rows} unique entries.")
    print("--- Data Preparation Complete ---")