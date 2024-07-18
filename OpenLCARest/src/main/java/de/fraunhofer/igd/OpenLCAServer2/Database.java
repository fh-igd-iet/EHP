/**
 * Eco Hybrid Platform - A tool to visualize LCIA Impacts and organize ILCD files
 * Copyright (C) 2024 Fraunhofer IGD
 * 
 * This program is free software: you can redistribute it and/or modify it under 
 * the terms of the GNU General  * Public License as published by the Free Software 
 * Foundation, either version 3 of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with this program. 
 * If not, see <https://www.gnu.org/licenses/>.
 */
package de.fraunhofer.igd.OpenLCAServer2;

import java.awt.geom.IllegalPathStateException;
import java.io.File;
import java.io.IOException;

import org.openlca.core.database.Derby;
import org.openlca.ilcd.io.ZipStore;
import org.openlca.io.ilcd.ILCDImport;
import org.openlca.io.ilcd.input.ImportConfig;

public class Database {

	private static boolean initialized = false;
	private static Derby lcaDB;
	private static File importDirectory;
	
	public static void initialize(String path, String importDirectory)
	{
		if(!initialized)
		{
			lcaDB = new Derby(new File(path));
			File importDir = new File(importDirectory);
			if(importDir.isDirectory() && importDir.canWrite())
			{
				Database.importDirectory = importDir;
			}else
			{
				throw new IllegalPathStateException("Directory "+importDirectory+" doesnt exist or is not writeable");
			}
		}
		initialized = true;
	}
	
	public static Derby getDb()
	{
		if(!initialized)
			throw new IllegalStateException("Derby-Database not initialized");
		return lcaDB;
	}
	
	public static void importILCD(String ilcdPath) throws IOException
	{
		if(!initialized)
			throw new IllegalStateException("Derby-Database not initialized");
		ImportConfig importCfg = new ImportConfig(new ZipStore(new File(ilcdPath)),lcaDB);
		ILCDImport imp = new ILCDImport(importCfg);
		
		imp.run();
	}
	
	public static String fileUploadPath()
	{
		if(!initialized)
			throw new IllegalStateException("Derby-Database not initialized");
		return importDirectory.getAbsolutePath();
	}
}