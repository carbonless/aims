/*
 Navicat Premium Data Transfer

 Source Server         : Maria
 Source Server Type    : MariaDB
 Source Server Version : 100028 (10.0.28-MariaDB-2+b1)
 Source Host           : 192.168.1.20:3306
 Source Schema         : AIM

 Target Server Type    : MariaDB
 Target Server Version : 100028 (10.0.28-MariaDB-2+b1)
 File Encoding         : 65001

 Date: 24/02/2023 18:35:35
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for Ammunition
-- ----------------------------
DROP TABLE IF EXISTS `Ammunition`;
CREATE TABLE `Ammunition`  (
  `BKI/UI` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Nature` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `NEQ` float NOT NULL,
  `HCC` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of Ammunition
-- ----------------------------

-- ----------------------------
-- Table structure for Explosive Storehouses ESH
-- ----------------------------
DROP TABLE IF EXISTS `Explosive Storehouses ESH`;
CREATE TABLE `Explosive Storehouses ESH`  (
  `ESH Index` int(11) NOT NULL,
  `Name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `Street` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `City` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `State/Province` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `Postal Code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `Country/Territory` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`ESH Index`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of Explosive Storehouses ESH
-- ----------------------------
INSERT INTO `Explosive Storehouses ESH` VALUES (1, 'Waffenplatz Thun', 'Waffenplatzstrasse 50', 'Thun', 'Bern', '3602', 'Switzerland');
INSERT INTO `Explosive Storehouses ESH` VALUES (2, 'Waffenplatz Bure', 'Obere Fabrikstrasse 50', 'Bure', 'Solothurn', '2915', 'Switzerland');
INSERT INTO `Explosive Storehouses ESH` VALUES (3, 'Waffenplatz Kloten', 'Schulstrasse 61', 'Kloten', 'Zurich', '8302', 'Switzerland');
INSERT INTO `Explosive Storehouses ESH` VALUES (4, 'Waffenplatz Emmen', 'Flugplatzstrasse 1', 'Emmen', 'Lucerne', '6032', 'Switzerland');
INSERT INTO `Explosive Storehouses ESH` VALUES (5, 'Waffenplatz Frauenfeld', 'Industriestrasse 27', 'Frauenfeld', 'Thurgau', '8501', 'Switzerland');
INSERT INTO `Explosive Storehouses ESH` VALUES (6, 'Waffenplatz Walenstadt', 'Chnobelweg 5', 'Walenstadt', 'St. Gallen', '8880', 'Switzerland');
INSERT INTO `Explosive Storehouses ESH` VALUES (7, 'Place d\'armes de Moudon', 'Rue du Château 28', 'Moudon', 'Vaud', '1510', 'Switzerland');
INSERT INTO `Explosive Storehouses ESH` VALUES (8, 'Place d\'armes de Sion', 'Avenue de la Gare 32', 'Sion', 'Valais', '1950', 'Switzerland');
INSERT INTO `Explosive Storehouses ESH` VALUES (9, 'Waffenplatz Chur', 'Kasernenstrasse 19', 'Chur', 'Graubunden', '7000', 'Switzerland');
INSERT INTO `Explosive Storehouses ESH` VALUES (10, 'Piazza d\'armi di Airolo', 'Via Strada per la Piana 22', 'Airolo', 'Ticino', '6780', 'Switzerland');

-- ----------------------------
-- Table structure for Manufacturer
-- ----------------------------
DROP TABLE IF EXISTS `Manufacturer`;
CREATE TABLE `Manufacturer`  (
  `Manu Index` int(11) NOT NULL,
  `Manufacturer Name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Address 1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `Address 2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `City` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `State/Province` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `Postal Code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `Country` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`Manu Index`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of Manufacturer
-- ----------------------------
INSERT INTO `Manufacturer` VALUES (1, 'Aguila', 'Carretera a Navajas km 3.8', 'Rancho El Soyatal', 'Cd. Cuauhtémoc', 'Chih', '32528', 'Mexico');
INSERT INTO `Manufacturer` VALUES (2, 'Alliant Techsystems (ATK)', '7480 Flying Cloud Drive', NULL, 'Eden Prairie', 'Minnesota', '55344-3372', 'USA');
INSERT INTO `Manufacturer` VALUES (3, 'American Ordnance', '2100 US-34', NULL, 'Middletown', 'Iowa', '52638', 'USA');
INSERT INTO `Manufacturer` VALUES (4, 'Arsenal JSCo', '7, Lomsko Shose Blvd.', NULL, 'Kazanlak', '-', '6100', 'Bulgaria');
INSERT INTO `Manufacturer` VALUES (5, 'Avibras Indústria Aeroespacial', 'Av. Paulista, 2421', NULL, 'São Paulo', 'São Paulo', '01310-300', 'Brazil');
INSERT INTO `Manufacturer` VALUES (6, 'BAE Systems (USA)', '1101 Wilson Boulevard', NULL, 'Arlington', 'Virginia', '22209', 'USA');
INSERT INTO `Manufacturer` VALUES (7, 'BAE Systems', '6 Carlton Gardens', NULL, 'London', '-', 'SW1Y 5AD', 'UK');
INSERT INTO `Manufacturer` VALUES (8, 'Barnes Bullets Inc.', '38 N Frontage Rd', NULL, 'Mona', 'UT', '84645', 'USA');
INSERT INTO `Manufacturer` VALUES (9, 'Bharat Dynamics Limited', 'Kanchanbagh', NULL, 'Hyderabad', 'Telangana', '500058', 'India');
INSERT INTO `Manufacturer` VALUES (10, 'Boeing', '100 North Riverside', NULL, 'Chicago', 'Illinois', '60606', 'USA');
INSERT INTO `Manufacturer` VALUES (11, 'Browning Ammunition', '9200 Cody Street', NULL, 'St Louis', 'MO', '63126', 'USA');
INSERT INTO `Manufacturer` VALUES (12, 'CAVIM (Compañía Anónima Venezolana de Industrias Militares)', 'Av. Fuerzas Armadas, Fortaleza de la Inmaculada', NULL, 'Maracay', 'Aragua', '2101', 'Venezuela');
INSERT INTO `Manufacturer` VALUES (13, 'CBC (Companhia Brasileira de Cartuchos)', 'Rod. BR 101, KM 266,2, s/nº', NULL, 'Ribeirão das Neves', 'Minas Gerais', '33880-970', 'Brazil');
INSERT INTO `Manufacturer` VALUES (14, 'CCI (Cascade Cartridge Inc.)', '2299 Snake River Ave', NULL, 'Lewiston ', 'ID ', '83501', 'USA');
INSERT INTO `Manufacturer` VALUES (15, 'China North Industries Corporation (NORINCO)', 'No. 16, Anding Road, Chaoyang District', NULL, 'Beijing', '-', '100029', 'China');
INSERT INTO `Manufacturer` VALUES (16, 'CSG (China South Industries Group) Beijing', 'Zhongshan South Road, Haidian District', NULL, 'Beijing', 'Beijing', '100089', 'China');
INSERT INTO `Manufacturer` VALUES (17, 'CSG (China South Industries Group) Nanjing', 'No.188, Pingyang Road, Nanjing Economic', NULL, 'Nanjing', '-', '210011', 'China');
INSERT INTO `Manufacturer` VALUES (18, 'Denel PMP (Kempton)', 'Atlas Road & Dunlop Street, Bonaero Park', NULL, 'Kempton Park', 'Gauteng', '1619', 'South Africa');
INSERT INTO `Manufacturer` VALUES (19, 'Denel PMP (Pretoria)', '1 Wilmar Road', NULL, 'Pretoria West', '-', '183', 'South Africa');
INSERT INTO `Manufacturer` VALUES (20, 'Diehl Defence (Germany)', 'Alte Nürnberger Str. 13', NULL, 'Überlingen', '-', '88662', 'Germany');
INSERT INTO `Manufacturer` VALUES (21, 'Eley', 'Marlow Rd', NULL, 'Birmingham ', NULL, 'B30 3JN', 'United Kingdom');
INSERT INTO `Manufacturer` VALUES (22, 'Eurenco', '3, rue Eugène et Armand Peugeot ZI La Pièce 8', NULL, 'Sorgues', '-', '84700', 'France');
INSERT INTO `Manufacturer` VALUES (23, 'Expal Systems S.A.', 'Carretera de Extremadura Km 23,5', NULL, 'Alcalá de Henares', '-', '28802', 'Spain');
INSERT INTO `Manufacturer` VALUES (24, 'Federal Cartridge Company (Federal Premium Ammunition)', '900 Ehlen Drive', NULL, 'Anoka', 'Minnesota', '55303', 'USA');
INSERT INTO `Manufacturer` VALUES (25, 'Federal Premium Ammunition', '900 Ehlen Dr.', NULL, 'Anoka', 'Minnesota', '55303', 'United States');
INSERT INTO `Manufacturer` VALUES (26, 'FN Herstal', 'Voie de Liège, 33', NULL, 'Herstal', 'Liège', '4040', 'Belgium');
INSERT INTO `Manufacturer` VALUES (27, 'General Dynamics', '2941 Fairview Park Drive', NULL, 'Falls Church', 'Virginia', '22042', 'USA');
INSERT INTO `Manufacturer` VALUES (28, 'General Dynamics Ordnance and Tactical Systems', '11399 16th Court N', NULL, 'St. Petersburg', 'Florida', '33716-2208', 'USA');
INSERT INTO `Manufacturer` VALUES (29, 'GGG (Girta Ginkluotes Gamykla)', 'Vištyčio g. 12', NULL, 'Naujoji Akmenė', 'N/A', 'LT-85118', 'Lithuania');
INSERT INTO `Manufacturer` VALUES (30, 'Hanwha Defense', '68 Chungmuro', NULL, 'Seoul', '-', '4510', 'South Korea');
INSERT INTO `Manufacturer` VALUES (31, 'Hirtenberger AG', 'Fabriksplatz 1', NULL, 'Hirtenberg', 'N/A', '2552', 'Austria');
INSERT INTO `Manufacturer` VALUES (32, 'Hirtenberger Defence Systems', 'Hirtenbergerstraße 1', NULL, 'Hirtenberg', '-', '2552', 'Austria');
INSERT INTO `Manufacturer` VALUES (33, 'Hornady Manufacturing Company', '3625 W Old Potash Hwy', NULL, 'Grand Island', 'Nebraska', '68803', 'United States');
INSERT INTO `Manufacturer` VALUES (34, 'IMI (Israel Military Industries)', 'P.O.Box 69', NULL, 'Ramat HaSharon', 'N/A', '4721325', 'Israel');
INSERT INTO `Manufacturer` VALUES (35, 'Indian Ordnance Factories', 'Ayudh Bhawan, Government of India, Ministry of Defence', NULL, 'Kolkata', 'West Bengal', '700027', 'India');
INSERT INTO `Manufacturer` VALUES (36, 'Israel Aerospace Industries', 'Ben Gurion International Airport', NULL, 'Lod', '-', '70100', 'Israel');
INSERT INTO `Manufacturer` VALUES (37, 'Israel Military Industries Ltd. (IMI)', 'P.O. Box 63', NULL, 'Ramat Hasharon', '-', '47100', 'Israel');
INSERT INTO `Manufacturer` VALUES (38, 'Kongsberg Defence & Aerospace', 'Kirkegårdsveien 45', NULL, 'Kongsberg', '-', '3616', 'Norway');
INSERT INTO `Manufacturer` VALUES (39, 'Lake City Army Ammunition Plant', '4500 NW 210th Street', NULL, 'Independence', 'Missouri', '64056', 'USA');
INSERT INTO `Manufacturer` VALUES (40, 'Lapua', 'Vihtavuoren Tehtaat Oy', 'Vihtavuorentie 109', 'Laukaa', NULL, '41330', 'Finland');
INSERT INTO `Manufacturer` VALUES (41, 'Lockheed Martin', '6801 Rockledge Dr.', NULL, 'Bethesda', 'Maryland', '20817', 'USA');
INSERT INTO `Manufacturer` VALUES (42, 'MBDA', '37 Boulevard de Montmorency', NULL, 'Paris', 'Ile-de-France', '75016', 'France');
INSERT INTO `Manufacturer` VALUES (43, 'MEN (Metallwerk Elisenhutte GmbH)', 'Schiessplatzstraße 5', NULL, 'Nassau', 'N/A', '56377', 'Germany');
INSERT INTO `Manufacturer` VALUES (44, 'Mitsubishi Heavy Industries', '16-5, Konan 2-chome, Minato-ku', NULL, 'Tokyo', '-', '108-8215', 'Japan');
INSERT INTO `Manufacturer` VALUES (45, 'Nammo AS', 'Mustadvegen 45', NULL, 'Raufoss', 'Oppland', '2830', 'Norway');
INSERT INTO `Manufacturer` VALUES (46, 'Nammo Raufoss AS', 'Raufossvegen 300', NULL, 'Raufoss', '-', '2830', 'Norway');
INSERT INTO `Manufacturer` VALUES (47, 'Nammo Talley (USA)', '1601 W. Pine Street', NULL, 'Mesa', 'Arizona', '85201', 'USA');
INSERT INTO `Manufacturer` VALUES (48, 'Nexter Munitions', '13 Rue Baudin', NULL, 'Bourges', '-', '18000', 'France');
INSERT INTO `Manufacturer` VALUES (49, 'Nitrochemie AG', 'Wolfgangstraße 23-25', NULL, 'Wimmis', '-', '3752', 'Germany');
INSERT INTO `Manufacturer` VALUES (50, 'Norinco', 'No.1, Sitong Road, Zhongshan District', NULL, 'Dalian', '-', '116033', 'China');
INSERT INTO `Manufacturer` VALUES (51, 'NORINCO (China North Industries Corporation)', '9 Yumin Road, Xicheng District', NULL, 'Beijing', 'Beijing', '100029', 'China');
INSERT INTO `Manufacturer` VALUES (52, 'NORINCO (China North Industries Corporation)', '65 Haishan Rd, Longquan District', NULL, 'Chengdu', 'Sichuan', '610100', 'China');
INSERT INTO `Manufacturer` VALUES (53, 'Norma Precision', 'Box 149', NULL, 'Åmotfors', 'N/A', 'SE-670 64', 'Sweden');
INSERT INTO `Manufacturer` VALUES (54, 'Northrop Grumman', '2980 Fairview Park Dr.', NULL, 'Falls Church', 'Virginia', '22042', 'USA');
INSERT INTO `Manufacturer` VALUES (55, 'Northrop Grumman Defense Systems', '3420 S. Broadway', NULL, 'St. Louis', 'Missouri', '63118-1803', 'USA');
INSERT INTO `Manufacturer` VALUES (56, 'Olin Corporation (Winchester Ammunition)', '600 Powder Mill Road', NULL, 'East Alton', 'Illinois', '62024-1273', 'USA');
INSERT INTO `Manufacturer` VALUES (57, 'Orbital ATK', '3300 South 900 West', NULL, 'Salt Lake City', 'UT', '84119', 'USA');
INSERT INTO `Manufacturer` VALUES (58, 'Orbital ATK (USA)', '1300 Wilson Blvd', NULL, 'Arlington', 'Virginia', '22209', 'USA');
INSERT INTO `Manufacturer` VALUES (59, 'PMC Ammunition', '940 Sheridan St.', NULL, 'Las Vegas', 'Nevada', '89103', 'United States');
INSERT INTO `Manufacturer` VALUES (60, 'Poongsan Corporation', '77 Saemangeum-gil, Buan-gun', NULL, 'Jeollabuk-do', 'N/A', '55362', 'South Korea');
INSERT INTO `Manufacturer` VALUES (61, 'Poongsan Corporation', '30-7 Yongam-ri, Seongsan-myeon', NULL, 'Changwon', 'Gyeongsangnam-do', '642-050', 'South Korea');
INSERT INTO `Manufacturer` VALUES (62, 'Poongsan Corporation', '149 Gwahak-ro (Dodam-dong), Yuseong-gu', NULL, 'Daejeon', '-', '34126', 'South Korea');
INSERT INTO `Manufacturer` VALUES (63, 'Poongsan Corporation', '127, Sanggok-ri, Jillyang-eup', NULL, 'Gyeongsan-si', 'Gyeongsangbuk-do', '712-851', 'South Korea');
INSERT INTO `Manufacturer` VALUES (64, 'Prvi Partizan', 'Uzicka 67', NULL, 'Uzice', 'N/A', '31000', 'Serbia');
INSERT INTO `Manufacturer` VALUES (65, 'Rafael Advanced Defense Systems', 'Ha\'harash St 16', NULL, 'Haifa', '-', '31021', 'Israel');
INSERT INTO `Manufacturer` VALUES (66, 'Raytheon', '870 Winter Street', NULL, 'Waltham', 'Massachusetts', '2451', 'USA');
INSERT INTO `Manufacturer` VALUES (67, 'Remington Arms Company, LLC', '870 Remington Dr.', NULL, 'Madison', 'North Carolina', '27025', 'United States');
INSERT INTO `Manufacturer` VALUES (68, 'Rheinmetall AG', 'Rheinmetall Platz 1', NULL, 'Düsseldorf', '-', '40476', 'Germany');
INSERT INTO `Manufacturer` VALUES (69, 'Rheinmetall Defense (USA)', '1275 Barlow Street', NULL, 'Traverse City', 'Michigan', '49686', 'USA');
INSERT INTO `Manufacturer` VALUES (70, 'Rheinmetall Waffe Munition GmbH', 'Zum Stiftsberg 2', NULL, 'Unterlüß', 'Niedersachsen', '29345', 'Germany');
INSERT INTO `Manufacturer` VALUES (71, 'Roketsan', 'Turgut Ozal Bulvari No: 71 06830', NULL, 'Ankara', '-', '-', 'Turkey');
INSERT INTO `Manufacturer` VALUES (72, 'Rosoboronexport', '27, Stromynka Str.', NULL, 'Moscow', '-', '107076', 'Russia');
INSERT INTO `Manufacturer` VALUES (73, 'RUAG Ammotec', 'Amsler-Laffon-Strasse 9', NULL, 'Thun', 'Bern', '3602', 'Switzerland');
INSERT INTO `Manufacturer` VALUES (74, 'RWS (Rottweil)', 'Robert Bosch Straße 5', NULL, 'Balingen', NULL, '72336', 'Germany');
INSERT INTO `Manufacturer` VALUES (75, 'S&T Motiv', '108, Beolmal-ro, Dongan-gu', NULL, 'Anyang-si', 'Gyeonggi-do', '14055', 'South Korea');
INSERT INTO `Manufacturer` VALUES (76, 'S&T Motiv (South Korea)', '88, Munji-ro Yuseong-gu', NULL, 'Daejeon', '-', '34054', 'South Korea');
INSERT INTO `Manufacturer` VALUES (77, 'Safran Electronics & Defense', '2 Boulevard du Général Martial Valin', NULL, 'Paris', 'Ile-de-France', '75015', 'France');
INSERT INTO `Manufacturer` VALUES (78, 'Sagem (France)', '27 rue Leblanc', NULL, 'Paris Cedex 15', '-', '75739', 'France');
INSERT INTO `Manufacturer` VALUES (79, 'Sako', 'Valmetinkatu 2', NULL, 'Riihimäki', 'N/A', '11120', 'Finland');
INSERT INTO `Manufacturer` VALUES (80, 'Sellier & Bellot', 'Vlašimská 162', NULL, 'Vlašim', 'N/A', '258 01', 'Czech Republic');
INSERT INTO `Manufacturer` VALUES (81, 'Simmel Difesa', 'Viale Gian Galeazzo Alessi, 2', NULL, 'Roma', '-', '152', 'Italy');
INSERT INTO `Manufacturer` VALUES (82, 'SK (Schönebeck)', 'Geschwister-Scholl-Straße 23', NULL, 'Schönebeck (Elbe)', NULL, '39218', 'Germany');
INSERT INTO `Manufacturer` VALUES (83, 'Soltam Systems (Israel)', 'P.O. Box 574', NULL, 'Yokneam Illit', '-', '20692', 'Israel');
INSERT INTO `Manufacturer` VALUES (84, 'ST Engineering', '1 Ang Mo Kio Electronics Park Road', NULL, 'Singapore', '-', '567710', 'Singapore');
INSERT INTO `Manufacturer` VALUES (85, 'Taurus Systems GmbH', 'Im Steiger 5-6', NULL, 'Überlingen', 'Baden-Württemberg', '88662', 'Germany');
INSERT INTO `Manufacturer` VALUES (86, 'Thales Group', '45 rue de Villiers', NULL, 'Neuilly-sur-Seine', 'Ile-de-France', '92200', 'France');
INSERT INTO `Manufacturer` VALUES (87, 'TulAmmo', '2150 South 950 East', NULL, 'Provo', 'Utah', '84606', 'United States');
INSERT INTO `Manufacturer` VALUES (88, 'UkrOboronProm', '26-28, Hospitalna St.', NULL, 'Kyiv', '-', '1601', 'Ukraine');
INSERT INTO `Manufacturer` VALUES (89, 'Winchester Ammunition', '600 Powder Mill Rd', NULL, 'East Alton', 'Illinois', '62024', 'United States');
INSERT INTO `Manufacturer` VALUES (90, 'Wolf Performance Ammunition', '17858 SW Upper Boones Ferry Rd', NULL, 'Durham', 'Oregon', '97224', 'United States');
INSERT INTO `Manufacturer` VALUES (91, 'Yugoimport SDPR (Serbia)', 'Bul. Umetnosti 2, P.O.Box 558', NULL, 'Belgrade', '-', '11070', 'Serbia');
INSERT INTO `Manufacturer` VALUES (92, 'Zakłady Metalowe Mesko S.A.', 'ul. Przemysłowa 2', NULL, 'Skarżysko-Kamienna', 'Świętokrzyskie', '26-110', 'Poland');
INSERT INTO `Manufacturer` VALUES (93, 'Zala Aero', '70A, Vatutina str.', NULL, 'Izhevsk', 'Udmurt Republic', '426000', 'Russia');
INSERT INTO `Manufacturer` VALUES (94, 'ZQI Ammunition', '2191A Defense Hwy Suite 403', NULL, 'Crofton', 'Maryland', '21114', 'United States');

-- ----------------------------
-- Table structure for Nature
-- ----------------------------
DROP TABLE IF EXISTS `Nature`;
CREATE TABLE `Nature`  (
  `Index` int(11) NOT NULL,
  `Nature` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`Index`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of Nature
-- ----------------------------
INSERT INTO `Nature` VALUES (1, 'Ball');
INSERT INTO `Nature` VALUES (2, 'Tracer');
INSERT INTO `Nature` VALUES (3, 'Armor-Piercing (AP)');
INSERT INTO `Nature` VALUES (4, 'Incendiary');
INSERT INTO `Nature` VALUES (5, 'Blank');
INSERT INTO `Nature` VALUES (6, 'Dummy');
INSERT INTO `Nature` VALUES (7, 'Practice');

SET FOREIGN_KEY_CHECKS = 1;
