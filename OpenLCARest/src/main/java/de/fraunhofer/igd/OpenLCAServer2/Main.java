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

import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Paths;

import org.apache.commons.cli.*;

import org.openlca.nativelib.NativeLib;
import org.openlca.nativelib.Module;

/**
 * Main class.
 *
 */
public class Main {

    /**
     * Starts Grizzly HTTP server exposing JAX-RS resources defined in this application.
     * @return Grizzly HTTP server.
     */
    public static HttpServer startServer(int port) {
        // create a resource config that scans for JAX-RS resources and providers
        // in de.fraunhofer.igd.OpenLCAServer2.resources
        final ResourceConfig rc = new ResourceConfig()
            .packages(
                "de.fraunhofer.igd.OpenLCAServer2.resources",
                "org.glassfish.jersey.examples.multipart")
            .register(MultiPartFeature.class);

        // create and start a new instance of grizzly http server
        // exposing the Jersey application at BASE_URI
        return GrizzlyHttpServerFactory.createHttpServer(URI.create("http://0.0.0.0:"+port+"/"), rc);
    }

    /**
     * Main method.
     * @param args
     * @throws IOException
     * @throws ParseException
     */
    public static void main(String[] args) throws IOException, ParseException {
        Options cmdOptions = new Options();
    	cmdOptions.addOption("c", true, "ini-file location");
        CommandLineParser cmdParser = new DefaultParser();
    	CommandLine cmd = cmdParser.parse(cmdOptions, args);

        String configPath;
    	if(cmd.hasOption("c"))
    	{
    		configPath = cmd.getOptionValue("c");
    	}else
    	{
    		// if no config path is given we try to find
    		// a config-file in the folder of the jar
    		try
			{
				String folder = new File(Main.class.getProtectionDomain().getCodeSource().getLocation()
		                                .toURI()).getParent();
				configPath = Paths.get(folder+"/OpenLCAServer.ini").toString();
			}catch(Exception e)
			{
				System.out.println(e.getMessage());
				System.out.println(e.getStackTrace());
				return;
			}
    	}
    	Configuration.load(new File(configPath));

        
        if(!NativeLib.isLoaded())
        {
            try {
                NativeLib.download(new File(Configuration.i().getExportDir()), Module.UMFPACK);
                NativeLib.download(new File(Configuration.i().getExportDir()), Module.BLAS);
            } catch (Exception e) {
                // TODO Auto-generated catch block
                System.out.println("Failed to download native libs");
                e.printStackTrace();
            }
            
            NativeLib.loadFrom(new File(Configuration.i().getExportDir()));
            if(NativeLib.isLoaded())
            {
                System.out.println("Native libs loaded");
            } else
            {
                System.out.println("Failed to load native libs");
            }
        }

        int port = Configuration.i().getPort();
    	String derbyPath = Configuration.i().getDerbyDBDir();
    	String importPath = Configuration.i().getUploadDir();
    	Database.initialize(derbyPath, importPath);
        final HttpServer server = startServer(port);
        System.out.println(String.format("Jersey app started with endpoints available at "
                + "http://localhost:%d%nHit Ctrl-C to stop it...", port));
        System.in.read();
        server.stop();
    }
}

