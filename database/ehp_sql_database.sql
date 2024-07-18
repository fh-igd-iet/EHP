DROP TABLE IF EXISTS Permission CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Permission;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Permission;
CREATE TABLE IF NOT EXISTS Permission(
    id SERIAL,
    name varchar(255) UNIQUE,
    PRIMARY KEY (id)
);
SELECT audit.audit_table('Permission');

DROP TABLE IF EXISTS Role CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Role;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Role;
CREATE TABLE IF NOT EXISTS Role(
    id SERIAL,
    name varchar(255) UNIQUE,
    PRIMARY KEY (id)
);
SELECT audit.audit_table('Role');

DROP TABLE IF EXISTS Login CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Login;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Login;
CREATE TABLE IF NOT EXISTS Login(
    id SERIAL ,
    login varchar(255) UNIQUE,
    password varchar(512) not null,
    PRIMARY KEY (id)
);
SELECT audit.audit_table('Login');

DROP TABLE IF EXISTS Login_Role_Link CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Login_Role_Link;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Login_Role_Link;
CREATE TABLE IF NOT EXISTS Login_Role_Link(
    Login_id integer NOT NULL,
    Role_id integer NOT NULL,
    
    PRIMARY KEY (Login_id, Role_id),
    FOREIGN KEY (Login_id) REFERENCES Login(id) ON DELETE CASCADE,
    FOREIGN KEY (Role_id) REFERENCES Role(id) ON DELETE CASCADE
);
SELECT audit.audit_table('Login_Role_Link');

DROP TABLE IF EXISTS Role_Permission_Link CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Role_Permission_Link;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Role_Permission_Link;
CREATE TABLE IF NOT EXISTS Role_Permission_Link(
    Role_id integer NOT NULL,
    Permission_id integer NOT NULL,
    
    PRIMARY KEY (Role_id, Permission_id),
    FOREIGN KEY (Role_id) REFERENCES Role(id) ON DELETE CASCADE,
    FOREIGN KEY (Permission_id) REFERENCES Permission(id) ON DELETE CASCADE
);
SELECT audit.audit_table('Role_Permission_Link');

DROP TABLE IF EXISTS Excelfile CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Excelfile;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Excelfile;
CREATE TABLE IF NOT EXISTS Excelfile(
    id SERIAL ,
    inserted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filename varchar(255),
    filecontent BYTEA,

    PRIMARY KEY (id)
);
SELECT audit.audit_table('Excelfile');

DROP TABLE IF EXISTS Cohort_Inventory CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Cohort_Inventory;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Cohort_Inventory;
CREATE TABLE IF NOT EXISTS Cohort_Inventory(
    id SERIAL ,
    letter char(1),
    description varchar(255),
    
    PRIMARY KEY (id)
);
SELECT audit.audit_table('Cohort_Inventory');

DROP TABLE IF EXISTS Owner CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Owner;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Owner;
CREATE TABLE IF NOT EXISTS Owner(
    Owner_id SERIAL,
    name varchar(255),
    
    PRIMARY KEY (Owner_id)
);
SELECT audit.audit_table('Owner');

DROP TABLE IF EXISTS SPD CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON SPD;
DROP TRIGGER IF EXISTS audit_trigger_stm ON SPD;
CREATE TABLE IF NOT EXISTS SPD(
    id varchar(127) NOT NULL,
    name varchar(255),
    type varchar(255),
    
    PRIMARY KEY (id)
);
SELECT audit.audit_table('SPD');

DROP TABLE IF EXISTS EDAS_Process CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON EDAS_Process;
DROP TRIGGER IF EXISTS audit_trigger_stm ON EDAS_Process;
CREATE TABLE IF NOT EXISTS EDAS_Process(
    id SERIAL ,
    Owner_id integer,
    Demo varchar(255),
    PD varchar(255),
    Explanation TEXT,
    rawMassEnergy varchar(255),
    rawSAM varchar(512),
    rawInfoSrcRef varchar(512),
    rawPartProcess varchar(512),
    rawKeyEcoWords varchar(512),
    rawMaterial varchar(512),
    rowColor varchar(127),
    SPD_id varchar(127),
    Excelfile_id integer,
    Excelfile_row integer,
    
    PRIMARY KEY (id),
    FOREIGN KEY (SPD_id) REFERENCES SPD(id),
    FOREIGN KEY (Excelfile_id) REFERENCES Excelfile(id),
    FOREIGN KEY (Owner_id) REFERENCES Owner(Owner_id)
);
SELECT audit.audit_table('EDAS_Process');

DROP TABLE IF EXISTS EDAS_Flag CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON EDAS_Flag;
DROP TRIGGER IF EXISTS audit_trigger_stm ON EDAS_Flag;
CREATE TABLE IF NOT EXISTS EDAS_Flag(
    id integer not null,
    SupLCA INTEGER,
    LCAp INTEGER,
    SLCA INTEGER,
    Validation_Analisys INTEGER,
    Acceptance INTEGER,
    eco_harmonisation INTEGER,
    Participatory_Disclosure INTEGER,
    SPD_strategy_paper_conveyance INTEGER,
    
    PRIMARY KEY (id),
    FOREIGN KEY (id) REFERENCES EDAS_Process(id) ON DELETE CASCADE
);
SELECT audit.audit_table('EDAS_Flag');

DROP TABLE IF EXISTS Process_Flag CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Process_Flag;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Process_Flag;
CREATE TABLE IF NOT EXISTS Process_Flag(
    id integer not null,
    SAM integer,
    SPD integer,
    InfoSrcRef integer,
    Owner integer,
    A integer,
    B integer,
    C integer,
    D integer,
    REUP integer,
    EoL integer,
    ADS integer,
    ASA integer,
    uniqueID integer,
    rawPartProcess integer,
    rawKeyEcoWords integer,
    Explanation integer,
    rawMaterial integer,
    rawMassEnergy integer,
    
    PRIMARY KEY (id),
    FOREIGN KEY (id) REFERENCES EDAS_Process(id) ON DELETE CASCADE
);
SELECT audit.audit_table('Process_Flag');

DROP TABLE IF EXISTS Process_Budget CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Process_Budget;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Process_Budget;
CREATE TABLE IF NOT EXISTS Process_Budget(
    id integer not null,
    A DOUBLE PRECISION,
    B DOUBLE PRECISION,
    C DOUBLE PRECISION,
    D DOUBLE PRECISION,
    REUP DOUBLE PRECISION,
    EoL DOUBLE PRECISION,
    ADS DOUBLE PRECISION,
    ASA DOUBLE PRECISION,
    grossfactor DOUBLE PRECISION,
    rawRow varchar(255),
    
    PRIMARY KEY (id),
    FOREIGN KEY (id) REFERENCES EDAS_Process(id) ON DELETE CASCADE
);
SELECT audit.audit_table('Process_Budget');

DROP TABLE IF EXISTS EDAS_Mapping CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON EDAS_Mapping;
DROP TRIGGER IF EXISTS audit_trigger_stm ON EDAS_Mapping;
CREATE TABLE IF NOT EXISTS EDAS_Mapping(
    id integer not null,
    SupLCA BOOLEAN DEFAULT false,
    LCAp BOOLEAN DEFAULT false,
    SLCA BOOLEAN DEFAULT false,
    Validation_Analisys BOOLEAN DEFAULT false,
    Acceptance BOOLEAN DEFAULT false,
    eco_harmonisation BOOLEAN DEFAULT false,
    Participatory_Disclosure BOOLEAN DEFAULT false,
    SPD_strategy_paper_conveyance BOOLEAN DEFAULT false,
    rawRow varchar(2048),
    
    PRIMARY KEY (id),
    FOREIGN KEY (id) REFERENCES EDAS_Process(id) ON DELETE CASCADE
);
SELECT audit.audit_table('EDAS_Mapping');

DROP TABLE IF EXISTS Aircraft_Part CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Aircraft_Part;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Aircraft_Part;
CREATE TABLE IF NOT EXISTS Aircraft_Part(
    id varchar(127) NOT NULL ,
    parent varchar(127),
    name varchar(255),
    
    PRIMARY KEY (id),
    FOREIGN KEY (parent) REFERENCES Aircraft_Part(id)
);
SELECT audit.audit_table('Aircraft_Part');

DROP TABLE IF EXISTS Process_Aircraft_Part_Link CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Process_Aircraft_Part_Link;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Process_Aircraft_Part_Link;
CREATE TABLE IF NOT EXISTS Process_Aircraft_Part_Link(
    Process_id integer NOT NULL,
    Aircraft_Part_id varchar(127) NOT NULL,
    
    PRIMARY KEY (Process_id, Aircraft_Part_id),
    FOREIGN KEY (Process_id) REFERENCES EDAS_Process(id) ON DELETE CASCADE,
    FOREIGN KEY (Aircraft_Part_id) REFERENCES Aircraft_Part(id)  ON DELETE CASCADE
);
SELECT audit.audit_table('Process_Aircraft_Part_Link');

DROP TABLE IF EXISTS Process_Cohort_Inventory_Link CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Process_Cohort_Inventory_Link;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Process_Cohort_Inventory_Link;
CREATE TABLE IF NOT EXISTS Process_Cohort_Inventory_Link(
    Process_id integer NOT NULL,
    Cohort_Inventory_id integer NOT NULL,
    proportion DOUBLE PRECISION,
    
    PRIMARY KEY (Process_id, Cohort_Inventory_id),
    FOREIGN KEY (Process_id) REFERENCES EDAS_Process(id) ON DELETE CASCADE,
    FOREIGN KEY (Cohort_Inventory_id) REFERENCES Cohort_Inventory(id) ON DELETE CASCADE
);
SELECT audit.audit_table('Process_Cohort_Inventory_Link');

DROP TABLE IF EXISTS InfoSrcRef CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON InfoSrcRef;
DROP TRIGGER IF EXISTS audit_trigger_stm ON InfoSrcRef;
CREATE TABLE IF NOT EXISTS InfoSrcRef(
    id integer not null,
    WP varchar(255),
    source varchar(255),
    SPD_id varchar(127),
    
    PRIMARY KEY (id),
    FOREIGN KEY (id) REFERENCES EDAS_Process(id) ON DELETE CASCADE,
    FOREIGN KEY (SPD_id) REFERENCES SPD(id) ON DELETE CASCADE
);
SELECT audit.audit_table('InfoSrcRef');

DROP TABLE IF EXISTS Keyword CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Keyword;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Keyword;
CREATE TABLE IF NOT EXISTS Keyword(
    id SERIAL ,
    keyword varchar(255),
    
    PRIMARY KEY (id)
);
SELECT audit.audit_table('Keyword');

DROP TABLE IF EXISTS Process_Keyword_Link CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Process_Keyword_Link;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Process_Keyword_Link;
CREATE TABLE IF NOT EXISTS Process_Keyword_Link(
    Process_id integer NOT NULL,
    Keyword_id integer NOT NULL,
    
    PRIMARY KEY (Process_id, Keyword_id),
    FOREIGN KEY (Process_id) REFERENCES EDAS_Process(id) ON DELETE CASCADE,
    FOREIGN KEY (Keyword_id) REFERENCES Keyword(id) ON DELETE CASCADE
);
SELECT audit.audit_table('Process_Keyword_Link');

DROP TABLE IF EXISTS Material CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Material;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Material;
CREATE TABLE IF NOT EXISTS Material(
    id SERIAL,
    name varchar(255),
    
    PRIMARY KEY (id)
);
SELECT audit.audit_table('Material');

DROP TABLE IF EXISTS Process_Material_Link CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Process_Material_Link;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Process_Material_Link;
CREATE TABLE IF NOT EXISTS Process_Material_Link(
    Process_id integer NOT NULL,
    Material_id integer NOT NULL,
    
    PRIMARY KEY (Process_id, Material_id),
    FOREIGN KEY (Process_id) REFERENCES EDAS_Process(id) ON DELETE CASCADE,
    FOREIGN KEY (Material_id) REFERENCES Material(id) ON DELETE CASCADE
);
SELECT audit.audit_table('Process_Material_Link');

DROP TABLE IF EXISTS Material_Identifier CASCADE;
DROP TRIGGER IF EXISTS audit_trigger_row ON Material_Identifier;
DROP TRIGGER IF EXISTS audit_trigger_stm ON Material_Identifier;
CREATE TABLE IF NOT EXISTS Material_Identifier(
    id integer NOT NULL,
    name varchar(255),
    
    PRIMARY KEY (id),
    FOREIGN KEY (id) REFERENCES Material(id) ON DELETE CASCADE
);
SELECT audit.audit_table('Material_Identifier');

-------------------------------------------------------------------
drop view if exists process_eco_content;
create view process_eco_content as 
  SELECT foo.id,
    foo.owner,
    foo.budget,
    foo.a,
    foo.b,
    foo.c,
    foo.d,
    foo.reup,
    foo.eol,
    foo.ads,
    foo.asa,
    foo.demo,
    foo.pd,
    foo.explanation,
    foo.spd_id,
    foo.excelfile_id,
    foo.excelfile_row,
    foo.rawsam,
    foo.rawinfosrcref,
    foo.rawmassenergy,
    foo.rawpartprocess,
    foo.rawkeyecowords,
    foo.rawmaterial,
    foo.filename
   FROM ( SELECT process.id,
            first(owner.name) AS owner,
            sum(process_budget.a + process_budget.b + process_budget.c + process_budget.d + process_budget.reup + process_budget.eol + process_budget.ads + process_budget.asa) AS budget,
            process_budget.a,
            process_budget.b,
            process_budget.c,
            process_budget.d,
            process_budget.reup,
            process_budget.eol,
            process_budget.ads,
            process_budget.asa,
            process.demo,
            process.pd,
            process.explanation,
            process.spd_id,
            process.excelfile_id,
            process.excelfile_row,
            process.rawsam,
            process.rowcolor,
            process.rawinfosrcref,
            process.rawmassenergy,
            process.rawpartprocess,
            process.rawkeyecowords,
            process.rawmaterial,
            excelfile.filename
           FROM edas_process as process,
            process_budget,
            owner,
            excelfile
          WHERE process.id = process_budget.id AND process.owner_id = owner.owner_id AND process.excelfile_id = excelfile.id
          GROUP BY process.id, process_budget.id, excelfile.filename
          ORDER BY process.id) foo
  WHERE foo.budget > 0::double precision OR foo.excelfile_id > 10;

