/*
 Navicat Premium Data Transfer

 Source Server         : Maria
 Source Server Type    : MariaDB
 Source Server Version : 100028 (10.0.28-MariaDB-2+b1)
 Source Host           : 10.0.0.41:3306
 Source Schema         : AIM

 Target Server Type    : MariaDB
 Target Server Version : 100028 (10.0.28-MariaDB-2+b1)
 File Encoding         : 65001

 Date: 27/02/2023 15:03:12
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for Ammunition
-- ----------------------------
DROP TABLE IF EXISTS `Ammunition`;
CREATE TABLE `Ammunition`  (
  `ammunition_id` int(11) NOT NULL,
  `Manufacturer` int(11) NULL DEFAULT NULL,
  `Nature` int(11) NULL DEFAULT NULL,
  `BKI_UI` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `NEQ` float NULL DEFAULT NULL,
  `HCC` int(3) NULL DEFAULT NULL,
  `Condition Code` int(11) NULL DEFAULT NULL,
  `Pack_QTY` int(11) NULL DEFAULT NULL,
  `Ban` tinyint(1) NULL DEFAULT NULL,
  `Ban_Text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `ESH` int(11) NULL DEFAULT NULL,
  `eUOS` decimal(10, 2) NULL DEFAULT NULL,
  `BKI_Date` datetime NULL DEFAULT NULL,
  `Quantity` int(11) NULL DEFAULT NULL,
  `Location_Bdg` int(5) NULL DEFAULT NULL,
  `Location_Floor` int(2) NULL DEFAULT NULL,
  `Location_Height` int(1) NULL DEFAULT NULL,
  PRIMARY KEY (`ammunition_id`) USING BTREE,
  INDEX `Nature`(`Nature`) USING BTREE,
  INDEX `ESH`(`ESH`) USING BTREE,
  INDEX `HCC`(`HCC`) USING BTREE,
  INDEX `CC`(`Condition Code`) USING BTREE,
  INDEX `Manufacturer`(`Manufacturer`) USING BTREE,
  CONSTRAINT `CC` FOREIGN KEY (`Condition Code`) REFERENCES `Condition_Code` (`CC_Index`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `ESH` FOREIGN KEY (`ESH`) REFERENCES `Explosive_Storehouses_ESH` (`ESH Index`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `HCC` FOREIGN KEY (`HCC`) REFERENCES `HCC` (`Index`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `Manufacturer` FOREIGN KEY (`Manufacturer`) REFERENCES `Manufacturer` (`Manu Index`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `Nature` FOREIGN KEY (`Nature`) REFERENCES `Nature` (`Index`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Compact;

SET FOREIGN_KEY_CHECKS = 1;
