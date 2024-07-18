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

import java.io.File;
import java.io.IOException;

import org.ini4j.Ini;
import org.ini4j.IniPreferences;
import org.ini4j.InvalidFileFormatException;

public class Configuration {
	
	private static Configuration current = null;
	
	private int port;
	private String uploadDir;
	private String exportDir;
	private String derbyDBDir;
	private String impactMethod;
	private String nativeLib;
	private boolean cors;
	
	private Configuration(){}
	public static void load(File f) throws InvalidFileFormatException, IOException
	{
		Ini ini = new Ini(f);
    	java.util.prefs.Preferences prefs = new IniPreferences(ini);
    	if(current == null)
    		current = new Configuration();
    	current.port = prefs.node("jetty").getInt("port", 4000);
    	current.uploadDir = prefs.node("jetty").get("upload-folder", null);
    	current.derbyDBDir = prefs.node("open-lca").get("database", null);
    	current.impactMethod = prefs.node("open-lca").get("impact-method", null);
    	current.cors = prefs.node("open-lca").getBoolean("cors", false);
    	current.nativeLib = prefs.node("open-lca").get("native-lib", null);
    	current.exportDir = prefs.node("open-lca").get("export-folder", null);
	}
	
	public int getPort()
	{
		return port;
	}
	
	public String getUploadDir()
	{
		return uploadDir;
	}
	
	public String getDerbyDBDir()
	{
		return derbyDBDir;
	}
	
	public String getExportDir()
	{
		return exportDir;
	}
	
	public String getImpactMethod()
	{
		return impactMethod;
	}
	
	public boolean getCors()
	{
		return cors;
	}
	
	public boolean getUseNativeLib()
	{
		return nativeLib != null;
	}

	public String getNativeLibPath()
	{
		return nativeLib;
	}
	
	public static Configuration i()
	{
		return current;
	}
	
	
}