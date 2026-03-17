CREATE TABLE IF NOT EXISTS user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS media (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    domain VARCHAR(255),
    category VARCHAR(50),
    icp_code VARCHAR(100),
    daily_visits VARCHAR(50),
    stats_auth_type VARCHAR(50),
    agent_auth_url VARCHAR(500),
    copyright_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'PENDING_REVIEW',
    rejection_reason TEXT,
    note TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS code_slot (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    media_id BIGINT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    terminal VARCHAR(50),
    display_type VARCHAR(50),
    ad_type VARCHAR(50),
    ad_form VARCHAR(50),
    ratio INT,
    style_type VARCHAR(50),
    note TEXT,
    image_url VARCHAR(500),
    width INT,
    height INT,
    is_shielding BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    code_content TEXT,
    revenue_ratio DECIMAL(4, 2) DEFAULT 1.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (media_id) REFERENCES media(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    date DATE,
    media_id BIGINT,
    code_slot_id BIGINT,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    ratio DECIMAL(4, 2) DEFAULT 1.00,
    revenue DECIMAL(10, 2) DEFAULT 0.00,
    extra_data TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (media_id) REFERENCES media(id),
    FOREIGN KEY (code_slot_id) REFERENCES code_slot(id)
);
