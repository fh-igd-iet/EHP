--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: aircraft_part; Type: TABLE DATA; Schema: public; Owner: postgres
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.aircraft_part DISABLE TRIGGER ALL;

INSERT INTO public.aircraft_part (id, parent, name) VALUES ('F', NULL, 'Fuselage');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('W', NULL, 'Wing');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('G', NULL, 'Gears');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('P', NULL, 'Propulsion');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('U', NULL, 'Utilities');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('P&S', NULL, 'Production & Services');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('S', NULL, 'Systems');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('WM', 'W', 'Wing Main');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('WO', 'W', 'Wing Other');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('FWB', 'F', 'Wing/Body');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('FFB', 'F', 'Forward Body');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('FRB', 'F', 'Rear Body');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('FCM', 'F', 'Cabin Module');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('FFM', 'F', 'Freight Module');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('FSM', 'F', 'Service Module');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('WMI', 'WM', 'Inner Wing');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('WMO', 'WM', 'Outer Wing');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('WMC', 'WM', 'Central Wing Box');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('WOE', 'WO', 'Elevator, Canard');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('WOP', 'WO', 'out of Plane');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('WOM', 'WO', 'Movable');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('GKI', 'G', 'Gear Kinematics & Interfaces');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('GWS', 'G', 'Wheel, Spurn, Ski');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('GT', 'G', 'Tire');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('PEC', 'P', 'Engine Core Unit');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('PFP', 'P', 'Fan, Propeller ');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('PGT', 'P', 'Gear Transmission, Shaft, Bearings');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('PBD', 'P', 'Body, Nacelle, Cowling');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('PEM', 'P', 'Engine Pylon, Mounting ');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('PEL', 'P', 'Hybrid or All Electric Propulsion Modules');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('UPF', 'U', 'Pax & Freight');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('UFL', 'U', 'Fuel');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('UOG', 'U', 'Oil & Grease');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('UFI', 'U', 'Food & Items');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('UWW', 'U', 'Water & Waste');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('UCI', 'U', 'Cleaning & De-Icing');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('UOE', 'U', 'Other Energy');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('UOC', 'U', 'Other Consumables');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('PE', 'P&S', 'Production Element');
INSERT INTO public.aircraft_part (id, parent, name) VALUES ('SSE', 'P&S', 'Supply & Services Element');


ALTER TABLE public.aircraft_part ENABLE TRIGGER ALL;

--
-- Data for Name: owner; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.owner DISABLE TRIGGER ALL;

INSERT INTO public.owner (owner_id, name) VALUES (1, '');

ALTER TABLE public.owner ENABLE TRIGGER ALL;

--
-- Data for Name: spd; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.spd DISABLE TRIGGER ALL;

INSERT INTO public.spd (id, name, type) VALUES ('AIR', 'Airframe', 'ITD');
INSERT INTO public.spd (id, name, type) VALUES ('ENG', 'Engine', 'ITD');
INSERT INTO public.spd (id, name, type) VALUES ('SYS', 'Systems', 'ITD');
INSERT INTO public.spd (id, name, type) VALUES ('FRC', 'Fast Rotorcraft', 'IADP');
INSERT INTO public.spd (id, name, type) VALUES ('LPA', 'Large Passenger Aircraft', 'IADP');
INSERT INTO public.spd (id, name, type) VALUES ('REG', 'Regional Aircraft', 'IADP');
INSERT INTO public.spd (id, name, type) VALUES ('P&S', 'Production & Services', NULL);


ALTER TABLE public.spd ENABLE TRIGGER ALL;

--
-- Data for Name: activitie; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.activitie DISABLE TRIGGER ALL;


ALTER TABLE public.activitie ENABLE TRIGGER ALL;

--
-- Data for Name: cohort_inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.cohort_inventory DISABLE TRIGGER ALL;

INSERT INTO public.cohort_inventory (id, letter, description) VALUES (1, 'a', 'Multifunctional Fuselage & Cabin');
INSERT INTO public.cohort_inventory (id, letter, description) VALUES (2, 'b', 'Advanced Wing Design');
INSERT INTO public.cohort_inventory (id, letter, description) VALUES (3, 'c', 'Major systems Treatmens & Euipment Integration');
INSERT INTO public.cohort_inventory (id, letter, description) VALUES (4, 'd', 'Engine');
INSERT INTO public.cohort_inventory (id, letter, description) VALUES (5, 'e', 'Future connected Factory');


ALTER TABLE public.cohort_inventory ENABLE TRIGGER ALL;

--
-- Data for Name: image; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.image DISABLE TRIGGER ALL;

ALTER TABLE public.image ENABLE TRIGGER ALL;

--
-- Data for Name: component; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.component DISABLE TRIGGER ALL;


ALTER TABLE public.component ENABLE TRIGGER ALL;

--
-- Data for Name: activitie_component_link; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.activitie_component_link DISABLE TRIGGER ALL;


ALTER TABLE public.activitie_component_link ENABLE TRIGGER ALL;

--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.role DISABLE TRIGGER ALL;

INSERT INTO public.role (id, name) VALUES (4, 'COA_Member');
INSERT INTO public.role (id, name) VALUES (5, 'ecoTA_Leader');
INSERT INTO public.role (id, name) VALUES (6, 'Administrator');
INSERT INTO public.role (id, name) VALUES (3, 'Editor');
INSERT INTO public.role (id, name) VALUES (14, 'Quality Assurance');
INSERT INTO public.role (id, name) VALUES (2, 'Viewer');


ALTER TABLE public.role ENABLE TRIGGER ALL;

--
-- Data for Name: activitie_role_link; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.activitie_role_link DISABLE TRIGGER ALL;



ALTER TABLE public.activitie_role_link ENABLE TRIGGER ALL;

--
-- Data for Name: excelfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.excelfile DISABLE TRIGGER ALL;



ALTER TABLE public.excelfile ENABLE TRIGGER ALL;

--
-- Data for Name: edas_process; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.edas_process DISABLE TRIGGER ALL;



ALTER TABLE public.edas_process ENABLE TRIGGER ALL;

--
-- Data for Name: edas_flag; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.edas_flag DISABLE TRIGGER ALL;



ALTER TABLE public.edas_flag ENABLE TRIGGER ALL;

--
-- Data for Name: edas_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.edas_mapping DISABLE TRIGGER ALL;



ALTER TABLE public.edas_mapping ENABLE TRIGGER ALL;

--
-- Data for Name: infosrcref; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.infosrcref DISABLE TRIGGER ALL;



ALTER TABLE public.infosrcref ENABLE TRIGGER ALL;

--
-- Data for Name: keyword; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.keyword DISABLE TRIGGER ALL;



ALTER TABLE public.keyword ENABLE TRIGGER ALL;

--
-- Data for Name: lcia_method; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.lcia_method DISABLE TRIGGER ALL;

INSERT INTO public.lcia_method (id, name, olca_name) VALUES (3, 'EF 3.0 validated', 'Environmental Footprint');


ALTER TABLE public.lcia_method ENABLE TRIGGER ALL;

--
-- Data for Name: lcia_indicator; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.lcia_indicator DISABLE TRIGGER ALL;

INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (0, 3, 'EF 3.0 Acidification - 2017', 'Acidification - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (1, 3, 'EF 3.0 Climate change - 2017', 'Climate change - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (2, 3, 'EF 3.0 Climate change-Biogenic - 2017', 'Climate change-Biogenic - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (3, 3, 'EF 3.0 Climate change-Fossil - 2017', 'Climate change-Fossil - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (4, 3, 'EF 3.0 Climate change-Land use and land use change - 2017', 'Climate change-Land use and land use change - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (5, 3, 'EF 3.0 Ecotoxicity, freshwater - 2017', 'Ecotoxicity, freshwater - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (7, 3, 'EF 3.0 Ecotoxicity, freshwater_inorganics - 2017', 'Ecotoxicity, freshwater_inorganics - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (9, 3, 'EF 3.0 Ecotoxicity, freshwater_metals - 2017', 'Ecotoxicity, freshwater_metals - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (10, 3, 'EF 3.0 Ecotoxicity, freshwater_organics - 2017', 'Ecotoxicity, freshwater_organics - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (11, 3, 'EF 3.0 EF-particulate Matter - 2017', 'EF-particulate Matter - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (12, 3, 'EF 3.0 Eutrophication marine - 2017', 'Eutrophication marine - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (13, 3, 'EF 3.0 Eutrophication, freshwater - 2017', 'Eutrophication, freshwater - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (14, 3, 'EF 3.0 Eutrophication, terrestrial - 2107', 'Eutrophication, terrestrial - 2107');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (15, 3, 'EF 3.0 Human toxicity, cancer - 2018', 'Human toxicity, cancer - 2018');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (16, 3, 'EF 3.0 Human toxicity, cancer_inorganics - 2018', 'Human toxicity, cancer_inorganics - 2018');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (17, 3, 'EF 3.0 Human toxicity, cancer_metals - 2018', 'Human toxicity, cancer_metals - 2018');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (18, 3, 'EF 3.0 Human toxicity, cancer_organics - 2018', 'Human toxicity, cancer_organics - 2018');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (19, 3, 'EF 3.0 Human toxicity, non-cancer - 2018', 'Human toxicity, non-cancer - 2018');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (20, 3, 'EF 3.0 Human toxicity, non-cancer_inorganics - 2018', 'Human toxicity, non-cancer_inorganics - 2018');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (21, 3, 'EF 3.0 Human toxicity, non-cancer_metals - 2018', 'Human toxicity, non-cancer_metals - 2018');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (22, 3, 'EF 3.0 Human toxicity, non-cancer_organics - 2018', 'Human toxicity, non-cancer_organics - 2018');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (23, 3, 'EF 3.0 Ionising radiation, human health - 2017', 'Ionising radiation, human health - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (24, 3, 'EF 3.0 Land use - 2017', 'Land use - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (25, 3, 'EF 3.0 Ozone depletion - 2017', 'Ozone depletion - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (26, 3, 'EF 3.0 Photochemical ozone formation - human health - 2017', 'Photochemical ozone formation - human health - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (27, 3, 'EF 3.0 Resource use, fossils - 2017', 'Resource use, fossils - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (28, 3, 'EF 3.0 Resource use, minerals and metals - 2017', 'Resource use, minerals and metals - 2017');
INSERT INTO public.lcia_indicator (id, method, name, olca_name) VALUES (29, 3, 'EF 3.0 Water use - 2017', 'Water use - 2017');


ALTER TABLE public.lcia_indicator ENABLE TRIGGER ALL;

--
-- Data for Name: olcaprocess; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.olcaprocess DISABLE TRIGGER ALL;


ALTER TABLE public.olcaprocess ENABLE TRIGGER ALL;

--
-- Data for Name: process; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.process DISABLE TRIGGER ALL;

ALTER TABLE public.process ENABLE TRIGGER ALL;

--
-- Data for Name: lcia_result; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.lcia_result DISABLE TRIGGER ALL;


ALTER TABLE public.lcia_result ENABLE TRIGGER ALL;

--
-- Data for Name: login; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.login DISABLE TRIGGER ALL;
INSERT INTO public.login (id, login, password) VALUES (2, 'superuser', '7fd5fa15fc57793def864691262a6ee6ba222a1c5cbadd8bfe49b8d59cefe5d3');


ALTER TABLE public.login ENABLE TRIGGER ALL;

--
-- Data for Name: login_role_link; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.login_role_link DISABLE TRIGGER ALL;

INSERT INTO public.login_role_link (login_id, role_id) VALUES (2, 4);
INSERT INTO public.login_role_link (login_id, role_id) VALUES (2, 5);
INSERT INTO public.login_role_link (login_id, role_id) VALUES (2, 6);
INSERT INTO public.login_role_link (login_id, role_id) VALUES (2, 14);


ALTER TABLE public.login_role_link ENABLE TRIGGER ALL;

--
-- Data for Name: material; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.material DISABLE TRIGGER ALL;



ALTER TABLE public.material ENABLE TRIGGER ALL;

--
-- Data for Name: material_identifier; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.material_identifier DISABLE TRIGGER ALL;



ALTER TABLE public.material_identifier ENABLE TRIGGER ALL;

--
-- Data for Name: permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.permission DISABLE TRIGGER ALL;

INSERT INTO public.permission (id, name) VALUES (1, 'rest_visualization_get');
INSERT INTO public.permission (id, name) VALUES (2, 'rest_visualization_post');
INSERT INTO public.permission (id, name) VALUES (3, 'rest_visualization_put');
INSERT INTO public.permission (id, name) VALUES (4, 'rest_visualization_delete');
INSERT INTO public.permission (id, name) VALUES (5, 'login');
INSERT INTO public.permission (id, name) VALUES (6, 'user_management_me');
INSERT INTO public.permission (id, name) VALUES (7, 'user_management_view');
INSERT INTO public.permission (id, name) VALUES (8, 'user_management_edit');
INSERT INTO public.permission (id, name) VALUES (9, 'edit_all_entities');
INSERT INTO public.permission (id, name) VALUES (10, 'is_coa_member');
INSERT INTO public.permission (id, name) VALUES (23, 'is_qa_member');


ALTER TABLE public.permission ENABLE TRIGGER ALL;

--
-- Data for Name: process_aircraft_part_link; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.process_aircraft_part_link DISABLE TRIGGER ALL;



ALTER TABLE public.process_aircraft_part_link ENABLE TRIGGER ALL;

--
-- Data for Name: process_budget; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.process_budget DISABLE TRIGGER ALL;



ALTER TABLE public.process_budget ENABLE TRIGGER ALL;

--
-- Data for Name: process_cohort_inventory_link; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.process_cohort_inventory_link DISABLE TRIGGER ALL;



ALTER TABLE public.process_cohort_inventory_link ENABLE TRIGGER ALL;

--
-- Data for Name: process_flag; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.process_flag DISABLE TRIGGER ALL;



ALTER TABLE public.process_flag ENABLE TRIGGER ALL;

--
-- Data for Name: process_keyword_link; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.process_keyword_link DISABLE TRIGGER ALL;



ALTER TABLE public.process_keyword_link ENABLE TRIGGER ALL;

--
-- Data for Name: process_material_link; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.process_material_link DISABLE TRIGGER ALL;



ALTER TABLE public.process_material_link ENABLE TRIGGER ALL;

--
-- Data for Name: role_permission_link; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public.role_permission_link DISABLE TRIGGER ALL;

INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (4, 10);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (5, 9);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (6, 1);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (6, 2);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (6, 3);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (6, 4);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (6, 6);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (6, 7);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (6, 8);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (6, 5);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (3, 2);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (3, 3);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (3, 4);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (3, 5);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (3, 6);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (3, 7);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (3, 1);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (14, 23);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (2, 1);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (2, 5);
INSERT INTO public.role_permission_link (role_id, permission_id) VALUES (2, 6);


ALTER TABLE public.role_permission_link ENABLE TRIGGER ALL;

--
-- Name: activitie_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activitie_id_seq', 58, true);


--
-- Name: cohort_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cohort_inventory_id_seq', 1, false);


--
-- Name: component_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.component_id_seq', 52, true);


--
-- Name: edas_process_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.edas_process_id_seq', 1, false);


--
-- Name: excelfile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.excelfile_id_seq', 1, true);


--
-- Name: image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.image_id_seq', 15, true);


--
-- Name: keyword_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.keyword_id_seq', 1, false);


--
-- Name: lcia_indicator_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lcia_indicator_id_seq', 33, true);


--
-- Name: lcia_method_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lcia_method_id_seq', 4, true);


--
-- Name: lcia_result_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lcia_result_id_seq', 12603, true);


--
-- Name: login_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.login_id_seq', 24, true);


--
-- Name: material_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.material_id_seq', 1, false);


--
-- Name: olcaprocess_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.olcaprocess_id_seq', 556, true);


--
-- Name: owner_owner_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.owner_owner_id_seq', 25, true);


--
-- Name: permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permission_id_seq', 22, true);


--
-- Name: process_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.process_id_seq', 100, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_id_seq', 13, true);


--
-- PostgreSQL database dump complete
--

