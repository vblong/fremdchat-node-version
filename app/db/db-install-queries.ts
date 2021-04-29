export const DB_TABLES_CREATE = [
    `CREATE TABLE IF NOT EXISTS block(
        idBlock varchar(255) COLLATE utf8_unicode_ci NOT NULL,
        idBlocked varchar(255) COLLATE utf8_unicode_ci NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;`,


    `CREATE TABLE IF NOT EXISTS filter (
    id tinyint(11) NOT NULL,
    description varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS locations (
      name text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      zipcode int(8) NOT NULL,
      longitude decimal(10,8) NOT NULL,
      latitude decimal(10,8) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS survey (
      ID bigint(25) NOT NULL,
      surveyTime datetime NOT NULL,
      content text COLLATE utf8mb4_unicode_ci DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,


    `CREATE TABLE IF NOT EXISTS users (
        ID bigint(25) UNSIGNED NOT NULL,
        name text COLLATE utf8_unicode_ci DEFAULT NULL,        
        connected int(11) NOT NULL DEFAULT 0,        
        inChat int(11) NOT NULL DEFAULT 0,        
        inQueue int(11) NOT NULL DEFAULT 0,
        partnerID bigint(25) DEFAULT NULL,
        lastConnect bigint(25) DEFAULT NULL,
        birthYear smallint(6) DEFAULT 1000,
        admin tinyint(4) DEFAULT 0,
        ageMin tinyint(4) DEFAULT 0,
        ageMax tinyint(4) DEFAULT 120,
        gender int(11) NOT NULL DEFAULT 0,
        orientation int(11) DEFAULT 5,
        startFrom datetime DEFAULT NULL,
        matchFrom datetime DEFAULT NULL,
        dob datetime DEFAULT NULL,
        realGender tinyint(4) DEFAULT NULL,
        selfConnect int(11) DEFAULT 0,
        numOfReviews int(8) DEFAULT 0,
        rating tinyint(4) DEFAULT 0,
        lastChatCount int(11) DEFAULT 0,
        ageFilterLastChange datetime DEFAULT '1900-01-01 00:00:00',
        birthYearChangeCount tinyint(4) DEFAULT 2,
        ageFilter tinyint(4) DEFAULT 3,
        endCount tinyint(4) DEFAULT 4,
        inInteractive TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;`
];
