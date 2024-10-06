import json


def extract_waste_data(filename):
    with open(filename, 'r') as file:
        lines = file.readlines()

    waste_data = {}

    for i, line in enumerate(lines):
        if "The expected mismanaged waste in 2024" in line:
            # Get the mismanaged waste value (2 lines below the statement)
            mismanaged_waste = lines[i + 2].strip()
            # Get the MWI percentage (13 lines above the statement)
            mwi_percentage = lines[i - 13].strip()
            # Get the archetype value (1 line above the statement)
            archetype = lines[i - 1].strip()
            # Go 22 rows up to get the country name
            country_index = i - 22
            if country_index >= 0:
                country = lines[country_index].strip()

                # Create a dictionary for the country data if it doesn't exist
                if country not in waste_data:
                    waste_data[country] = {
                        "waste": mismanaged_waste,
                        "mwi": mwi_percentage,
                        "archetype": archetype
                    }

    return waste_data


def save_to_json(data, output_filename):
    with open(output_filename, 'w') as json_file:
        json.dump(data, json_file, indent=4)


if __name__ == "__main__":
    report_filename = "report.txt"
    output_json_filename = "waste_data.json"

    extracted_data = extract_waste_data(report_filename)
    save_to_json(extracted_data, output_json_filename)
    print(f"Data extracted and saved to {output_json_filename}.")
