DROP TABLE IF EXISTS Activitie CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Activitie;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Activitie;
CREATE TABLE IF NOT EXISTS Activitie(
    id SERIAL,
    extern_id varchar(255) UNIQUE,
    owner_id integer,
    title varchar(255),
    validation_by varchar(255),
    lci_analyst varchar(255),
    env_improvement varchar(255),
    ecolonomic_motivation varchar(255),
    composites double precision,
    additive_manufacturing double precision,
    machining double precision,
    hazards_reg_substances double precision,
    recycling double precision,
    digital_materials double precision,
    water double precision,
    struct_health_monitoring double precision,
    storage_supply_transmission_material double precision,
    storage_supply_transmission_electrical double precision,
    socio_economic double precision,
    comment varchar(255),
    SPD_id varchar(127),
    Aircraft_Part_id varchar(127),
    FOREIGN KEY (SPD_id) REFERENCES SPD(id),
    FOREIGN KEY (Aircraft_Part_id) REFERENCES Aircraft_Part(id),
    FOREIGN KEY (Owner_id) REFERENCES Owner(owner_id),
    PRIMARY KEY (id)
);
SELECT audit.audit_table('Activitie');

DROP TABLE IF EXISTS Image CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Image;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Image;
CREATE TABLE IF NOT EXISTS Image(
    id SERIAL,
    name varchar(255),
    mime varchar(255),
    data bytea,
    PRIMARY KEY (id)
);
SELECT audit.audit_table('Image');

DROP TABLE IF EXISTS OLCAProcess CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON OLCAProcess;
DROP TRIGGER IF EXISTS audit_trigger_stm ON OLCAProcess;
CREATE TABLE IF NOT EXISTS OLCAProcess(
    id SERIAL,
    olca_id integer,
    name varchar(255),
    reference decimal,
    reference_unit varchar(255),
    confidentiality varchar(255) DEFAULT 'COA, confidential',
    owner_id integer,
    verified boolean DEFAULT FALSE,
    
    PRIMARY KEY (id),
    UNIQUE (olca_id),
    FOREIGN KEY (Owner_id) REFERENCES Owner(owner_id)
);
SELECT audit.audit_table('OLCAProcess');

DROP TABLE IF EXISTS Component CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Component;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Component;
CREATE TABLE IF NOT EXISTS Component(
    id SERIAL,
    demo_nr varchar(255),
    code varchar(255) UNIQUE,
    name varchar(255),
    SPD_id varchar(127),
    is_demo boolean not null DEFAULT FALSE,
    image_id integer,
    parent_id integer,
    PRIMARY KEY (id),
    FOREIGN KEY (SPD_id) REFERENCES SPD(id),
    FOREIGN KEY (image_id) REFERENCES Image(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES Component(id) ON DELETE SET NULL
);
SELECT audit.audit_table('Component');

DROP TABLE IF EXISTS Activitie_Component_Link CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Activitie_Component_Link;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Activitie_Component_Link;
CREATE TABLE IF NOT EXISTS Activitie_Component_Link(
    Activitie_id integer NOT NULL,
    Component_id integer NOT NULL,
    Cohort_Inventory_id integer Not NULL,
    
    PRIMARY KEY (Activitie_id, Component_id, Cohort_Inventory_id),
    FOREIGN KEY (Cohort_Inventory_id) REFERENCES Cohort_Inventory(id),
    FOREIGN KEY (Activitie_id) REFERENCES Activitie(id) ON DELETE CASCADE,
    FOREIGN KEY (Component_id) REFERENCES Component(id) ON DELETE CASCADE
);
SELECT audit.audit_table('Activitie_Component_Link');

DROP TABLE IF EXISTS Activitie_Role_Link CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Activitie_Role_Link;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Activitie_Role_Link;
CREATE TABLE IF NOT EXISTS Activitie_Role_Link(
    Activitie_id integer NOT NULL,
    Role_id integer NOT NULL,
    
    PRIMARY KEY (Activitie_id, Role_id),
    FOREIGN KEY (Activitie_id) REFERENCES Activitie(id) ON DELETE CASCADE,
    FOREIGN KEY (Role_id) REFERENCES Role(id) ON DELETE CASCADE
);
SELECT audit.audit_table('Activitie_Role_Link');

DROP TABLE IF EXISTS Process CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Process;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Process;
CREATE TABLE IF NOT EXISTS Process(
    id SERIAL,
    extern_id varchar(255) UNIQUE,
    name varchar(255),
    SPD_id varchar(127),
    Activitie_id integer,
    olcaprocess integer UNIQUE,
    parent_id integer,
    
    PRIMARY KEY (id),
    FOREIGN KEY (SPD_id) REFERENCES SPD(id),
    FOREIGN KEY (Activitie_id) REFERENCES Activitie(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES Process(id) ON DELETE SET NULL,
    FOREIGN KEY (OLCAProcess) REFERENCES OLCAProcess(id) ON DELETE SET NULL ON UPDATE CASCADE
);
SELECT audit.audit_table('Process');

DROP TABLE IF EXISTS LCIA_Method CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON LCIA_Method;
DROP TRIGGER IF EXISTS audit_trigger_stm ON LCIA_Method;
CREATE TABLE IF NOT EXISTS LCIA_Method(
    id SERIAL,
    name varchar(255),
    olca_name varchar(255),
        
    PRIMARY KEY (id)
);
SELECT audit.audit_table('LCIA_Method');

DROP TABLE IF EXISTS LCIA_Indicator CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON LCIA_Indicator;
DROP TRIGGER IF EXISTS audit_trigger_stm ON LCIA_Indicator;
CREATE TABLE IF NOT EXISTS LCIA_Indicator(
    id SERIAL,
    method integer NOT NULL,
    name varchar(255),
    olca_name varchar(255),    
    PRIMARY KEY (id),
    FOREIGN KEY (method) REFERENCES LCIA_Method(id)
);
SELECT audit.audit_table('LCIA_Indicator');

DROP TABLE IF EXISTS LCIA_Result CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON LCIA_Result;
DROP TRIGGER IF EXISTS audit_trigger_stm ON LCIA_Result;
CREATE TABLE IF NOT EXISTS LCIA_Result(
    id SERIAL,
    indicator integer NOT NULL,
    process integer,
    olcaprocess integer,
    value decimal NOT NULL,
    
    PRIMARY KEY (id),
    FOREIGN KEY (indicator) REFERENCES LCIA_Indicator(id) ON DELETE CASCADE,
    FOREIGN KEY (process) REFERENCES Process(id) ON DELETE CASCADE,
    FOREIGN KEY (olcaprocess) REFERENCES OLCAProcess(olca_id) ON DELETE CASCADE ON UPDATE CASCADE
);
SELECT audit.audit_table('LCIA_Result');