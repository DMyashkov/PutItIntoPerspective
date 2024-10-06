import json
import re


# Function to clean and convert waste values to numbers
def clean_data(data):
    cleaned_data = {}

    for country, info in data.items():
        try:
            # Attempt to clean waste value
            # Remove all non-digit characters and convert to int
            waste_value = int(re.sub(r'\D', '', info['waste']))

            # Attempt to clean mwi value
            # Remove the '%' and convert to float
            mwi_value = float(info['mwi'].strip('%'))

            # Add cleaned entry to the result
            cleaned_data[country] = {
                "waste": waste_value,
                "mwi": mwi_value,
                "archetype": info['archetype']
            }
        except (ValueError, TypeError) as e:
            # Print a message if the conversion fails and skip the entry
            print(f"Skipped {country} due to conversion error: {e}")

    return cleaned_data


# Read the data from 'waste_data.json'
try:
    with open('waste_data.json', 'r') as f:
        data = json.load(f)
except FileNotFoundError:
    print("Error: 'waste_data.json' file not found.")
    exit(1)

# Clean the input data
cleaned_data = clean_data(data)

# Save the cleaned data to a new JSON file
with open('cleaned_data.json', 'w') as f:
    json.dump(cleaned_data, f, indent=4)

print("Cleaned data saved to 'cleaned_data.json'")
