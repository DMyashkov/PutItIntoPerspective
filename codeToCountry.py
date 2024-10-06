
import json

# Load the country to code data from 'countryToCode.json'
try:
    with open('countryToCode.json', 'r') as f:
        country_to_code = json.load(f)
except FileNotFoundError:
    print("Error: 'countryToCode.json' file not found.")
    exit(1)

# Reverse the dictionary: code to country
code_to_country = {code: country for country, code in country_to_code.items()}

# Save the reversed data to 'codeToCountry.json'
with open('codeToCountry.json', 'w') as f:
    json.dump(code_to_country, f, indent=4)

print("Reversed data saved to 'codeToCountry.json'")
