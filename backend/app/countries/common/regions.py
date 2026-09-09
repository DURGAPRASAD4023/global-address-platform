"""Subdivision / Region / State expansion mappings.

Ensures that state, province, and region fields across all markets are expanded
into full, long, and detailed format (never short codes, abbreviations, or ISO-3166-2 tags).
"""

from __future__ import annotations

import re
import unicodedata

# Comprehensive mapping: (country_code, normalized_alias) -> full official region name
REGION_EXPANSIONS: dict[str, dict[str, str]] = {
    "US": {
        "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
        "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
        "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
        "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
        "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
        "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
        "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
        "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
        "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
        "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
        "DC": "District of Columbia", "PR": "Puerto Rico", "VI": "Virgin Islands", "GU": "Guam",
        "AS": "American Samoa", "MP": "Northern Mariana Islands",
    },
    "CA": {
        "AB": "Alberta", "BC": "British Columbia", "MB": "Manitoba", "NB": "New Brunswick",
        "NL": "Newfoundland and Labrador", "NS": "Nova Scotia", "NT": "Northwest Territories",
        "NU": "Nunavut", "ON": "Ontario", "PE": "Prince Edward Island", "QC": "Quebec",
        "SK": "Saskatchewan", "YT": "Yukon",
    },
    "MX": {
        "AGU": "Aguascalientes", "BCN": "Baja California", "BCS": "Baja California Sur",
        "CAM": "Campeche", "CHP": "Chiapas", "CHH": "Chihuahua", "COA": "Coahuila",
        "COL": "Colima", "DUR": "Durango", "GUA": "Guanajuato", "GRO": "Guerrero",
        "HID": "Hidalgo", "JAL": "Jalisco", "MEX": "State of Mexico", "MIC": "Michoacán",
        "MOR": "Morelos", "NAY": "Nayarit", "NLE": "Nuevo León", "OAX": "Oaxaca",
        "PUE": "Puebla", "QUE": "Querétaro", "ROO": "Quintana Roo", "SLP": "San Luis Potosí",
        "SIN": "Sinaloa", "SON": "Sonora", "TAB": "Tabasco", "TAM": "Tamaulipas",
        "TLA": "Tlaxcala", "VER": "Veracruz", "YUC": "Yucatán", "ZAC": "Zacatecas",
        "CDMX": "Ciudad de México", "DF": "Ciudad de México",
    },
    "AU": {
        "ACT": "Australian Capital Territory", "NSW": "New South Wales", "NT": "Northern Territory",
        "QLD": "Queensland", "SA": "South Australia", "TAS": "Tasmania", "VIC": "Victoria",
        "WA": "Western Australia",
    },
    "BR": {
        "AC": "Acre", "AL": "Alagoas", "AP": "Amapá", "AM": "Amazonas", "BA": "Bahia",
        "CE": "Ceará", "DF": "Distrito Federal", "ES": "Espírito Santo", "GO": "Goiás",
        "MA": "Maranhão", "MT": "Mato Grosso", "MS": "Mato Grosso do Sul", "MG": "Minas Gerais",
        "PA": "Pará", "PB": "Paraíba", "PR": "Paraná", "PE": "Pernambuco", "PI": "Piauí",
        "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte", "RS": "Rio Grande do Sul",
        "RO": "Rondônia", "RR": "Roraima", "SC": "Santa Catarina", "SP": "São Paulo",
        "SE": "Sergipe", "TO": "Tocantins",
    },
    "DE": {
        "BW": "Baden-Württemberg", "BY": "Bavaria", "BE": "Berlin", "BB": "Brandenburg",
        "HB": "Bremen", "HH": "Hamburg", "HE": "Hesse", "MV": "Mecklenburg-Vorpommern",
        "NI": "Lower Saxony", "NW": "North Rhine-Westphalia", "RP": "Rhineland-Palatinate",
        "SL": "Saarland", "SN": "Saxony", "ST": "Saxony-Anhalt", "SH": "Schleswig-Holstein",
        "TH": "Thuringia",
    },
    "FR": {
        "IDF": "Île-de-France", "ARA": "Auvergne-Rhône-Alpes", "BFC": "Bourgogne-Franche-Comté",
        "BRE": "Brittany", "CVL": "Centre-Val de Loire", "COR": "Corsica", "GES": "Grand Est",
        "HDF": "Hauts-de-France", "NOR": "Normandy", "NAQ": "Nouvelle-Aquitaine", "OCC": "Occitanie",
        "PDL": "Pays de la Loire", "PAC": "Provence-Alpes-Côte d'Azur",
    },
    "IT": {
        "ABR": "Abruzzo", "BAS": "Basilicata", "CAL": "Calabria", "CAM": "Campania",
        "EMR": "Emilia-Romagna", "FVG": "Friuli Venezia Giulia", "LAZ": "Lazio", "LIG": "Liguria",
        "LOM": "Lombardia", "MAR": "Marche", "MOL": "Molise", "PIE": "Piemonte",
        "PUG": "Puglia", "SAR": "Sardegna", "SIC": "Sicilia", "TOS": "Toscana",
        "TAA": "Trentino-Alto Adige", "UMB": "Umbria", "VDA": "Valle d'Aosta", "VEN": "Veneto",
        "RM": "Lazio", "MI": "Lombardia", "VE": "Veneto", "FI": "Toscana", "NA": "Campania",
    },
    "ES": {
        "AN": "Andalucía", "AR": "Aragón", "AS": "Asturias", "IB": "Islas Baleares",
        "PV": "País Vasco", "CN": "Canarias", "CB": "Cantabria", "CL": "Castilla y León",
        "CM": "Castilla-La Mancha", "CT": "Cataluña", "EX": "Extremadura", "GA": "Galicia",
        "MD": "Comunidad de Madrid", "MU": "Región de Murcia", "NA": "Navarra",
        "RI": "La Rioja", "VC": "Comunidad Valenciana",
    },
    "NL": {
        "DR": "Drenthe", "FL": "Flevoland", "FR": "Fryslân", "GE": "Gelderland",
        "GR": "Groningen", "LI": "Limburg", "NB": "Noord-Brabant", "NH": "Noord-Holland",
        "OV": "Overijssel", "UT": "Utrecht", "ZE": "Zeeland", "ZH": "Zuid-Holland",
    },
    "BE": {
        "BRU": "Brussels-Capital Region", "VAN": "Antwerp", "VBR": "Flemish Brabant",
        "VLI": "Limburg", "VOV": "East Flanders", "VWV": "West Flanders",
        "WBR": "Walloon Brabant", "WHT": "Hainaut", "WLG": "Liège",
        "WLX": "Luxembourg", "WNA": "Namur", "WAL": "Wallonia",
    },
    "CH": {
        "AG": "Aargau", "AI": "Appenzell Innerrhoden", "AR": "Appenzell Ausserrhoden",
        "BE": "Bern", "BL": "Basel-Landschaft", "BS": "Basel-Stadt", "FR": "Fribourg",
        "GE": "Geneva", "GL": "Glarus", "GR": "Graubünden", "JU": "Jura", "LU": "Lucerne",
        "NE": "Neuchâtel", "NW": "Nidwalden", "OW": "Obwalden", "SG": "St. Gallen",
        "SH": "Schaffhausen", "SO": "Solothurn", "SZ": "Schwyz", "TG": "Thurgau",
        "TI": "Ticino", "UR": "Uri", "VD": "Vaud", "VS": "Valais", "ZG": "Zug", "ZH": "Zürich",
    },
    "AT": {
        "1": "Burgenland", "2": "Carinthia", "3": "Lower Austria", "4": "Upper Austria",
        "5": "Salzburg", "6": "Styria", "7": "Tyrol", "8": "Vorarlberg", "9": "Vienna",
        "B": "Burgenland", "K": "Carinthia", "NO": "Lower Austria", "OO": "Upper Austria",
        "S": "Salzburg", "ST": "Styria", "T": "Tyrol", "V": "Vorarlberg", "W": "Vienna",
    },
    "SE": {
        "AB": "Stockholm County", "C": "Uppsala County", "D": "Södermanland County",
        "E": "Östergötland County", "F": "Jönköping County", "G": "Kronoberg County",
        "H": "Kalmar County", "I": "Gotland County", "K": "Blekinge County",
        "M": "Skåne County", "N": "Halland County", "O": "Västra Götaland County",
        "S": "Värmland County", "T": "Örebro County", "U": "Västmanland County",
        "W": "Dalarna County", "X": "Gävleborg County", "Y": "Västernorrland County",
        "Z": "Jämtland County", "AC": "Västerbotten County", "BD": "Norrbotten County",
    },
    "NO": {
        "03": "Oslo", "11": "Rogaland", "15": "Møre og Romsdal", "18": "Nordland",
        "30": "Viken", "34": "Innlandet", "38": "Vestfold og Telemark",
        "42": "Agder", "46": "Vestland", "50": "Trøndelag", "54": "Troms og Finnmark",
    },
    "DK": {
        "84": "Capital Region of Denmark", "82": "Central Denmark Region",
        "81": "North Denmark Region", "83": "Region of Southern Denmark",
        "85": "Region Zealand",
    },
    "FI": {
        "18": "Uusimaa", "19": "Southwest Finland", "11": "Pirkanmaa",
        "02": "South Karelia", "04": "Kainuu", "05": "Kanta-Häme",
        "06": "Central Ostrobothnia", "07": "Central Finland", "08": "Kymenlaakso",
        "09": "Lapland", "10": "North Karelia", "12": "Ostrobothnia",
        "13": "North Ostrobothnia", "14": "North Savo", "15": "Päijät-Häme",
        "16": "Satakunta", "17": "South Savo", "01": "Åland",
    },
    "IE": {
        "CW": "County Carlow", "CN": "County Cavan", "CE": "County Clare", "CO": "County Cork",
        "DL": "County Donegal", "D": "County Dublin", "GY": "County Galway", "G": "County Galway",
        "KY": "County Kerry", "KE": "County Kildare", "KK": "County Kilkenny", "LS": "County Laois",
        "LM": "County Leitrim", "LK": "County Limerick", "LD": "County Longford", "LH": "County Louth",
        "MO": "County Mayo", "MH": "County Meath", "MN": "County Monaghan", "OY": "County Offaly",
        "RN": "County Roscommon", "SO": "County Sligo", "TY": "County Tipperary", "WD": "County Waterford",
        "WH": "County Westmeath", "WX": "County Wexford", "WW": "County Wicklow",
    },
    "PL": {
        "DS": "Lower Silesian Voivodeship", "KP": "Kuyavian-Pomeranian Voivodeship",
        "LU": "Lublin Voivodeship", "LB": "Lubusz Voivodeship", "LD": "Łódź Voivodeship",
        "MA": "Lesser Poland Voivodeship", "MZ": "Masovian Voivodeship", "OP": "Opole Voivodeship",
        "PK": "Subcarpathian Voivodeship", "PD": "Podlaskie Voivodeship", "PM": "Pomeranian Voivodeship",
        "SL": "Silesian Voivodeship", "SK": "Świętokrzyskie Voivodeship", "WN": "Warmian-Masurian Voivodeship",
        "WP": "Greater Poland Voivodeship", "ZP": "West Pomeranian Voivodeship",
    },
    "PT": {
        "01": "Aveiro District", "02": "Beja District", "03": "Braga District", "04": "Bragança District",
        "05": "Castelo Branco District", "06": "Coimbra District", "07": "Évora District", "08": "Faro District",
        "09": "Guarda District", "10": "Leiria District", "11": "Lisbon District", "12": "Portalegre District",
        "13": "Porto District", "14": "Santarém District", "15": "Setúbal District", "16": "Viana do Castelo District",
        "17": "Vila Real District", "18": "Viseu District", "20": "Azores", "30": "Madeira",
    },
    "CZ": {
        "10": "Prague", "20": "Central Bohemian Region", "31": "South Bohemian Region",
        "32": "Plzeň Region", "41": "Karlovy Vary Region", "42": "Ústí nad Labem Region",
        "51": "Liberec Region", "52": "Hradec Králové Region", "53": "Pardubice Region",
        "63": "Vysočina Region", "64": "South Moravian Region", "71": "Olomouc Region",
        "72": "Zlín Region", "80": "Moravian-Silesian Region",
    },
    "GR": {
        "I": "Attica", "A": "Eastern Macedonia and Thrace", "B": "Central Macedonia",
        "C": "Western Macedonia", "D": "Epirus", "E": "Thessaly", "F": "Ionian Islands",
        "G": "Western Greece", "H": "Central Greece", "J": "Peloponnese",
        "K": "North Aegean", "L": "South Aegean", "M": "Crete",
    },
    "HU": {
        "BU": "Budapest", "BK": "Bács-Kiskun", "BA": "Baranya", "BE": "Békés", "BZ": "Borsod-Abaúj-Zemplén",
        "CS": "Csongrád-Csanád", "FE": "Fejér", "GS": "Győr-Moson-Sopron", "HB": "Hajdú-Bihar",
        "HE": "Heves", "JN": "Jász-Nagykun-Szolnok", "KE": "Komárom-Esztergom", "NO": "Nógrád",
        "PE": "Pest", "SO": "Somogy", "SZ": "Szabolcs-Szatmár-Bereg", "TO": "Tolna",
        "VA": "Vas", "VE": "Veszprém", "ZA": "Zala",
    },
    "RO": {
        "B": "Bucharest", "AB": "Alba", "AR": "Arad", "AG": "Argeș", "BC": "Bacău", "BH": "Bihor",
        "BN": "Bistrița-Năsăud", "BT": "Botoșani", "BV": "Brașov", "BR": "Brăila", "BZ": "Buzău",
        "CS": "Caraș-Severin", "CL": "Călărași", "CJ": "Cluj", "CT": "Constanța", "CV": "Covasna",
        "DB": "Dâmbovița", "DJ": "Dolj", "GL": "Galați", "GR": "Giurgiu", "GJ": "Gorj",
        "HR": "Harghita", "HD": "Hunedoara", "IL": "Ialomița", "IS": "Iași", "IF": "Ilfov",
        "MM": "Maramureș", "MH": "Mehedinți", "MS": "Mureș", "NT": "Neamț", "OT": "Olt",
        "PH": "Prahova", "SM": "Satu Mare", "SJ": "Sălaj", "SB": "Sibiu", "SV": "Suceava",
        "TR": "Teleorman", "TM": "Timiș", "TL": "Tulcea", "VS": "Vaslui", "VL": "Vâlcea", "VN": "Vrancea",
    },
    "UA": {
        "30": "Kyiv", "46": "Lviv Oblast", "51": "Odesa Oblast", "63": "Kharkiv Oblast",
        "12": "Dnipropetrovsk Oblast", "23": "Zaporizhzhia Oblast",
    },
    "LU": {
        "LU": "Luxembourg Canton", "CA": "Capellen", "CL": "Clervaux", "DI": "Diekirch",
        "EC": "Echternach", "ES": "Esch-sur-Alzette", "GR": "Grevenmacher",
    },
    "SK": {
        "BL": "Bratislava Region", "TT": "Trnava Region", "TN": "Trenčín Region",
        "NR": "Nitra Region", "ZA": "Žilina Region", "BC": "Banská Bystrica Region",
        "PO": "Prešov Region", "KI": "Košice Region",
    },
    "RU": {
        "MOW": "Moscow", "SPE": "Saint Petersburg", "MOS": "Moscow Oblast", "LEN": "Leningrad Oblast",
        "TAT": "Republic of Tatarstan", "SVE": "Sverdlovsk Oblast", "NVS": "Novosibirsk Oblast",
    },
    "CN": {
        "BJ": "Beijing", "SH": "Shanghai", "TJ": "Tianjin", "CQ": "Chongqing",
        "GD": "Guangdong", "ZJ": "Zhejiang", "JS": "Jiangsu", "SD": "Shandong",
        "SC": "Sichuan", "HB": "Hubei", "HN": "Hunan", "FJ": "Fujian",
    },
    "JP": {
        "01": "Hokkaido", "13": "Tokyo", "14": "Kanagawa", "27": "Osaka", "26": "Kyoto",
        "23": "Aichi", "28": "Hyogo", "40": "Fukuoka", "11": "Saitama", "12": "Chiba",
    },
    "KR": {
        "11": "Seoul", "26": "Busan", "27": "Daegu", "28": "Incheon",
        "29": "Gwangju", "30": "Daejeon", "31": "Ulsan", "41": "Gyeonggi Province",
        "42": "Gangwon Province", "43": "North Chungcheong", "44": "South Chungcheong",
        "45": "North Jeolla", "46": "South Jeolla", "47": "North Gyeongsang", "48": "South Gyeongsang",
        "49": "Jeju",
    },
    "IN": {
        "AN": "Andaman and Nicobar Islands", "AP": "Andhra Pradesh", "AR": "Arunachal Pradesh",
        "AS": "Assam", "BR": "Bihar", "CH": "Chandigarh", "CG": "Chhattisgarh", "CT": "Chhattisgarh",
        "DH": "Dadra and Nagar Haveli and Daman and Diu", "DL": "Delhi", "GA": "Goa",
        "GJ": "Gujarat", "HR": "Haryana", "HP": "Himachal Pradesh", "JK": "Jammu and Kashmir",
        "JH": "Jharkhand", "KA": "Karnataka", "KL": "Kerala", "LA": "Ladakh", "LD": "Lakshadweep",
        "MP": "Madhya Pradesh", "MH": "Maharashtra", "MN": "Manipur", "ML": "Meghalaya",
        "MZ": "Mizoram", "NL": "Nagaland", "OD": "Odisha", "OR": "Odisha", "PY": "Puducherry",
        "PB": "Punjab", "RJ": "Rajasthan", "SK": "Sikkim", "TN": "Tamil Nadu", "TS": "Telangana",
        "TG": "Telangana", "TR": "Tripura", "UP": "Uttar Pradesh", "UK": "Uttarakhand",
        "UA": "Uttarakhand", "WB": "West Bengal",
    },
    "NZ": {
        "AUK": "Auckland Region", "BOP": "Bay of Plenty Region", "CAN": "Canterbury Region",
        "GIS": "Gisborne District", "HKB": "Hawke's Bay Region", "MWT": "Manawatū-Whanganui",
        "MBH": "Marlborough District", "NSN": "Nelson City", "NTL": "Northland Region",
        "OTA": "Otago Region", "STL": "Southland Region", "TAS": "Tasman District",
        "TKI": "Taranaki Region", "WKO": "Waikato Region", "WGN": "Wellington Region",
        "WTC": "West Coast Region",
    },
    "SG": {
        "SG": "Central Region", "CS": "Central Singapore", "NE": "North East",
        "NW": "North West", "SE": "South East", "SW": "South West",
    },
    "ID": {
        "JK": "Special Capital Region of Jakarta", "YO": "Special Region of Yogyakarta",
        "BA": "Bali", "JB": "West Java", "JT": "Central Java", "JI": "East Java",
        "BT": "Banten", "SU": "North Sumatra", "SB": "West Sumatra", "RI": "Riau",
    },
    "MY": {
        "01": "Johor", "02": "Kedah", "03": "Kelantan", "04": "Melaka", "05": "Negeri Sembilan",
        "06": "Pahang", "07": "Penang", "08": "Perak", "09": "Perlis", "10": "Selangor",
        "11": "Terengganu", "12": "Sabah", "13": "Sarawak", "14": "Federal Territory of Kuala Lumpur",
        "15": "Federal Territory of Labuan", "16": "Federal Territory of Putrajaya",
    },
    "TH": {
        "10": "Bangkok", "50": "Chiang Mai", "83": "Phuket", "20": "Chonburi",
        "30": "Nakhon Ratchasima", "40": "Khon Kaen", "70": "Ratchaburi",
    },
    "VN": {
        "HN": "Hanoi", "SG": "Ho Chi Minh City", "DN": "Da Nang", "HP": "Hai Phong", "CT": "Can Tho",
    },
    "PH": {
        "00": "Metro Manila", "NCR": "Metro Manila", "01": "Ilocos Region", "02": "Cagayan Valley",
        "03": "Central Luzon", "4A": "Calabarzon", "4B": "Mimaropa", "05": "Bicol Region",
        "06": "Western Visayas", "07": "Central Visayas", "08": "Eastern Visayas",
        "09": "Zamboanga Peninsula", "10": "Northern Mindanao", "11": "Davao Region",
        "12": "Soccsksargen", "13": "Caraga", "BARMM": "Bangsamoro", "CAR": "Cordillera Administrative Region",
    },
    "TW": {
        "TPE": "Taipei City", "NWT": "New Taipei City", "TYN": "Taoyuan City",
        "TXG": "Taichung City", "TNN": "Tainan City", "KHH": "Kaohsiung City",
        "HSC": "Hsinchu City", "KEE": "Keelung City",
    },
    "HK": {
        "HK": "Hong Kong Island", "KLN": "Kowloon", "NT": "New Territories",
    },
    "PK": {
        "IS": "Islamabad Capital Territory", "PB": "Punjab", "SD": "Sindh",
        "KP": "Khyber Pakhtunkhwa", "BA": "Balochistan", "GB": "Gilgit-Baltistan", "AJK": "Azad Jammu and Kashmir",
    },
    "BD": {
        "A": "Barisal Division", "B": "Chittagong Division", "C": "Dhaka Division",
        "D": "Khulna Division", "E": "Rajshahi Division", "F": "Rangpur Division",
        "G": "Sylhet Division", "H": "Mymensingh Division",
    },
    "KZ": {
        "71": "Astana", "75": "Almaty", "79": "Shymkent", "11": "Akmola Region",
        "15": "Aktobe Region", "19": "Almaty Region", "23": "Atyrau Region",
    },
    "AE": {
        "AZ": "Abu Dhabi", "DU": "Dubai", "SH": "Sharjah", "AJ": "Ajman",
        "UQ": "Umm Al Quwain", "RK": "Ras Al Khaimah", "FU": "Fujairah",
    },
    "SA": {
        "01": "Riyadh Province", "02": "Makkah Province", "03": "Eastern Province",
        "04": "Medina Province", "05": "Al Qassim Province", "06": "Ha'il Province",
        "07": "Tabuk Province", "08": "Northern Borders Province", "09": "Jazan Province",
        "10": "Najran Province", "11": "Al Bahah Province", "12": "Al Jawf Province", "14": "Asir Province",
    },
    "IL": {
        "JM": "Jerusalem District", "TA": "Tel Aviv District", "HA": "Haifa District",
        "C": "Central District", "N": "Northern District", "S": "Southern District",
    },
    "TR": {
        "34": "Istanbul", "06": "Ankara", "35": "Izmir", "07": "Antalya",
        "16": "Bursa", "01": "Adana", "27": "Gaziantep", "42": "Konya",
    },
    "QA": {
        "DA": "Doha Municipality", "RA": "Al Rayyan", "WA": "Al Wakrah", "KH": "Al Khor",
    },
    "AR": {
        "C": "Ciudad Autónoma de Buenos Aires", "B": "Buenos Aires Province",
        "X": "Córdoba Province", "S": "Santa Fe Province", "M": "Mendoza Province",
    },
    "CL": {
        "RM": "Región Metropolitana de Santiago", "VS": "Región de Valparaíso",
        "BI": "Región del Biobío", "AN": "Región de Antofagasta",
    },
    "CO": {
        "DC": "Bogotá, Distrito Capital", "ANT": "Antioquia", "VAL": "Valle del Cauca",
        "ATL": "Atlántico", "CUN": "Cundinamarca", "SAN": "Santander", "BOL": "Bolívar",
    },
    "PE": {
        "LIM": "Lima Region", "CAL": "Callao", "ARE": "Arequipa", "CUS": "Cusco",
        "LAL": "La Libertad", "PIU": "Piura", "LAM": "Lambayeque",
    },
    "UY": {
        "MO": "Montevideo Department", "CA": "Canelones Department", "MA": "Maldonado Department",
        "CO": "Colonia Department", "RO": "Rocha Department", "SA": "Salto Department",
    },
    "ZA": {
        "EC": "Eastern Cape", "FS": "Free State", "GP": "Gauteng", "KZN": "KwaZulu-Natal",
        "LP": "Limpopo", "MP": "Mpumalanga", "NW": "North West", "NC": "Northern Cape", "WC": "Western Cape",
    },
    "EG": {
        "C": "Cairo Governorate", "GZ": "Giza Governorate", "ALX": "Alexandria Governorate",
        "LX": "Luxor Governorate", "ASN": "Aswan Governorate", "DK": "Dakahlia Governorate",
    },
    "NG": {
        "LA": "Lagos State", "FC": "Federal Capital Territory", "KN": "Kano State",
        "RV": "Rivers State", "OY": "Oyo State", "KD": "Kaduna State",
    },
    "KE": {
        "30": "Nairobi County", "47": "Mombasa County", "31": "Nakuru County",
        "22": "Kiambu County", "17": "Kisumu County", "42": "Uasin Gishu County",
    },
    "MA": {
        "CAS": "Casablanca-Settat", "RAB": "Rabat-Salé-Kénitra", "MAR": "Marrakesh-Safi",
        "TNG": "Tanger-Tetouan-Al Hoceima", "FES": "Fès-Meknès", "SOS": "Souss-Massa",
    },
}


def expand_region(country_code: str, region_value: str | None) -> str | None:
    """Expand any regional short code or abbreviation to the full detailed official name.

    If region_value is already a full name or unknown, returns normalized title-cased name.
    """
    if not region_value:
        return None

    raw = region_value.strip()
    if not raw:
        return None

    cc = country_code.upper()
    country_map = REGION_EXPANSIONS.get(cc, {})

    # 1. Clean ISO prefixes like "US-CA", "CA-ON", "BR-SP"
    clean_code = raw.upper()
    if clean_code.startswith(f"{cc}-"):
        clean_code = clean_code[len(cc) + 1 :]

    # Check direct match on cleaned code
    if clean_code in country_map:
        return country_map[clean_code]

    # 2. Case-insensitive key match
    for k, v in country_map.items():
        if k.upper() == clean_code or k.upper() == raw.upper():
            return v

    # 3. Check if raw already matches a known full expansion value
    for v in country_map.values():
        if v.lower() == raw.lower():
            return v

    # 4. If short code of length <= 4 with no match, return upper, else Title Case
    # Normalizing unicode and whitespace
    text = unicodedata.normalize("NFC", raw)
    text = re.sub(r"\s+", " ", text).strip()
    return text
