COUNTRIES = [
    ("A", "MEX", "México", "Mexico"), ("A", "RSA", "África do Sul", "South Africa"), ("A", "KOR", "Coreia do Sul", "South Korea"), ("A", "CZE", "República Tcheca", "Czech Republic"),
    ("B", "CAN", "Canadá", "Canada"), ("B", "BIH", "Bósnia e Herzegovina", "Bosnia and Herzegovina"), ("B", "QAT", "Catar", "Qatar"), ("B", "SUI", "Suíça", "Switzerland"),
    ("C", "BRA", "Brasil", "Brazil"), ("C", "MAR", "Marrocos", "Morocco"), ("C", "HAI", "Haiti", "Haiti"), ("C", "SCO", "Escócia", "Scotland"),
    ("D", "USA", "Estados Unidos", "United States"), ("D", "PAR", "Paraguai", "Paraguay"), ("D", "AUS", "Austrália", "Australia"), ("D", "TUR", "Turquia", "Turkey"),
    ("E", "GER", "Alemanha", "Germany"), ("E", "CUW", "Curaçao", "Curaçao"), ("E", "CIV", "Costa do Marfim", "Ivory Coast"), ("E", "ECU", "Equador", "Ecuador"),
    ("F", "NED", "Holanda", "Netherlands"), ("F", "JPN", "Japão", "Japan"), ("F", "SWE", "Suécia", "Sweden"), ("F", "TUN", "Tunísia", "Tunisia"),
    ("G", "BEL", "Bélgica", "Belgium"), ("G", "EGY", "Egito", "Egypt"), ("G", "IRN", "Irã", "Iran"), ("G", "NZL", "Nova Zelândia", "New Zealand"),
    ("H", "ESP", "Espanha", "Spain"), ("H", "CPV", "Cabo Verde", "Cape Verde"), ("H", "KSA", "Arábia Saudita", "Saudi Arabia"), ("H", "URU", "Uruguai", "Uruguay"),
    ("I", "FRA", "França", "France"), ("I", "SEN", "Senegal", "Senegal"), ("I", "IRQ", "Iraque", "Iraq"), ("I", "NOR", "Noruega", "Norway"),
    ("J", "ARG", "Argentina", "Argentina"), ("J", "ALG", "Argélia", "Algeria"), ("J", "AUT", "Áustria", "Austria"), ("J", "JOR", "Jordânia", "Jordan"),
    ("K", "POR", "Portugal", "Portugal"), ("K", "COD", "RD Congo", "DR Congo"), ("K", "UZB", "Uzbequistão", "Uzbekistan"), ("K", "COL", "Colômbia", "Colombia"),
    ("L", "ENG", "Inglaterra", "England"), ("L", "CRO", "Croácia", "Croatia"), ("L", "GHA", "Gana", "Ghana"), ("L", "PAN", "Panamá", "Panama"),
]
COUNTRY_BY_PT = {pt: {"group": group, "code": code, "namePt": pt, "nameEn": en} for group, code, pt, en in COUNTRIES}
