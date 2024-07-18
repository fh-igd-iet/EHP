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
package de.fraunhofer.igd.OpenLCAServer2.resources;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.xml.bind.annotation.XmlRootElement;

import org.apache.commons.lang3.RandomStringUtils;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.openlca.core.database.Derby;
import org.openlca.core.database.ProcessDao;
import org.openlca.core.model.Exchange;
import org.openlca.core.model.Process;
import org.openlca.core.model.ProcessType;
import org.openlca.ilcd.io.ZipStore;
import org.openlca.io.ilcd.ILCDImport;
import org.openlca.io.ilcd.input.ImportConfig;
import org.openlca.core.model.Exchange;

import de.fraunhofer.igd.OpenLCAServer2.Database;


@Path("import")
public class ImportRestController {
	
	@POST
	@Consumes(MediaType.MULTIPART_FORM_DATA)
	public Response importDatabase(
			@FormDataParam("file") InputStream fileInputStream,
			@FormDataParam("file") FormDataContentDisposition fileMeta)
	{
		boolean error = false;
		String uploadPath = Database.fileUploadPath() + "/" + fileMeta.getFileName() + randomString();
		int totalLength = 0;
	    try
	    {
	        int read = 0;
	        byte[] bytes = new byte[1024];
	 
	        OutputStream out = new FileOutputStream(new File(uploadPath));
	        while ((read = fileInputStream.read(bytes)) != -1)
	        {
	            out.write(bytes, 0, read);
	            totalLength += read;
	        }
	        out.flush();
	        out.close();
	        
	        try
	        {
	        	System.out.println("importing file");
	        	System.out.println(uploadPath);
	        	Database.importILCD(uploadPath);
	        }catch(Exception e)
	        {
	        	error = true;
	        }finally
	        {
	        	File f = new File(uploadPath);
	        	f.delete();
	        }
	    } catch (IOException e)
	    {
	        error = true;
	    }
	    if(error)
	    {
	    	return Response.serverError().build();
	    }
	    System.out.println("Uploaded "+totalLength/1000000+"MB");
		return Response.ok().build();
	}
	
	@POST
	@Path("single")
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_OCTET_STREAM)
	public ImportResponse importSingleProcess(
			InputStream fileInputStream)
	{
		System.out.println("import single");
		boolean error = false;
		String errorMessage = "";
		long id = 0;
		String reference_unit = "";
		double reference_amount = 0;
		String uploadPath = Database.fileUploadPath() + "/" + randomString();
		int totalLength = 0;
	    try
	    {
	        int read = 0;
	        byte[] bytes = new byte[1024];
	 
	        OutputStream out = new FileOutputStream(new File(uploadPath));
	        while ((read = fileInputStream.read(bytes)) != -1)
	        {
	            out.write(bytes, 0, read);
	            totalLength += read;
	        }
	        out.flush();
	        out.close();
	        
	        try
	        {
	        	System.out.println("importing file");
	        	System.out.println(uploadPath);
	        	Derby testDB = Derby.createInMemory();
				ZipStore store = new ZipStore( new File(uploadPath));
	        	ImportConfig config = new ImportConfig(store,testDB);
	        	ILCDImport importer = new ILCDImport(config);
	        	importer.run();
	        	ProcessDao processDao = new ProcessDao(testDB);
	    		List<Process> processList = processDao.getAll();
	    		int count = processList.size();
	    		testDB.delete();
	    		if(count!=1)
	    		{
	    			error = true;
	    			errorMessage = "Only one process allowed.";
	    		}else
	    		{	
					if(processList.get(0).processType != ProcessType.LCI_RESULT)
					{
						error = true;
						errorMessage = "Process is not aggregated.";
					} else
					{
						String uuid = processList.get(0).refId;
						config = new ImportConfig(store,Database.getDb());
						importer = new ILCDImport(config);
						importer.run();
						processDao = new ProcessDao(Database.getDb());
						Process process = processDao.getForRefId(uuid);
						reference_unit = process.quantitativeReference.flow.name + " (" + 
							process.quantitativeReference.unit.name + ")";
						reference_amount = process.quantitativeReference.amount;
						if(process != null)
						{
							id = process.id;
						}else
						{
							error = true;
							errorMessage = "Import failed.";
						}
					}
	    		}
	    		
	        }catch(Exception e)
	        {
	        	e.printStackTrace();
	        	error = true;
	        	errorMessage = "Import failed!";
	        }finally
	        {
	        	File f = new File(uploadPath);
	        	f.delete();
	        }
	    } catch (IOException e)
	    {
	    	e.printStackTrace();
	        error = true;
	        errorMessage = "Internal Error.";
	    }
	    if(!error)
	    {
	    	System.out.println("Uploaded "+totalLength/1000000+"MB");
	    }
	    ImportResponse rtn = new ImportResponse();
	    rtn.error = error;
	    rtn.message = errorMessage;
	    rtn.id = id;
		rtn.reference_unit = reference_unit;
		rtn.reference_amount = 0;
		return rtn;
	}
	    
    @POST
	@Path("updatesingle/{oldid}")
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_OCTET_STREAM)
	public ImportResponse updateSingleProcess(
			@PathParam("oldid")int oldid,
			InputStream fileInputStream)
	{
		System.out.println("update single");
		boolean error = false;
		String errorMessage = "";
		long id = 0;
		String name = "";
		String reference_unit = "";
		double reference_amount = 0;
		String uploadPath = Database.fileUploadPath() + "/" + randomString();
		int totalLength = 0;
	    try
	    {
	        int read = 0;
	        byte[] bytes = new byte[1024];
	 
	        OutputStream out = new FileOutputStream(new File(uploadPath));
	        while ((read = fileInputStream.read(bytes)) != -1)
	        {
	            out.write(bytes, 0, read);
	            totalLength += read;
	        }
	        out.flush();
	        out.close();
	        
	        try
	        {
	        	System.out.println("importing file");
	        	System.out.println(uploadPath);
	        	Derby testDB = Derby.createInMemory();
				ZipStore store = new ZipStore(new File(uploadPath));
	        	ImportConfig config = new ImportConfig(store,testDB);
	        	ILCDImport importer = new ILCDImport(config);
	        	importer.run();
	        	ProcessDao processDao = new ProcessDao(testDB);
	    		List<Process> processList = processDao.getAll();
	    		int count = processList.size();
	    		testDB.delete();
	    		if(count != 1)
	    		{
	    			error = true;
	    			errorMessage = "Only one process allowed.";
	    		}else
	    		{	
					if(processList.get(0).processType != ProcessType.LCI_RESULT)
					{
						error = true;
						errorMessage = "Process is not aggregated.";
					} else
					{
						String uuid = processList.get(0).refId;
						config = new ImportConfig(store,Database.getDb());
						importer = new ILCDImport(config);
						importer.run();
						processDao = new ProcessDao(Database.getDb());
						Process process = processDao.getForRefId(uuid);
						
						if(process != null)
						{
							id = process.id;
							name = process.name;
							
							// Successfull upload delete old process
							Process p = processDao.getForId(oldid);
							processDao.delete(p);
						}else
						{
							error = true;
							errorMessage = "No process found.";
						}
					}
	    		}
	        	
	        }catch(Exception e)
	        {
	        	e.printStackTrace();
	        	error = true;
	        	errorMessage = "Import failed!";
	        }finally
	        {
	        	File f = new File(uploadPath);
	        	f.delete();
	        }
	    } catch (IOException e)
	    {
	    	e.printStackTrace();
	        error = true;
	        errorMessage = "Internal Error.";
	    }
	    if(!error)
	    {
	    	System.out.println("Uploaded "+totalLength/1000000+"MB");
	    }
    
	    ImportResponse rtn = new ImportResponse();
	    rtn.error = error;
	    rtn.message = errorMessage;
	    rtn.id = id;
	    rtn.name = name;
		rtn.reference_unit = reference_unit;
		rtn.reference_amount = reference_amount;
		return rtn;
	}
	
	@POST
	@Path("singletry")
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_OCTET_STREAM)
	public ImportResponse importSingleProcessTry(
			InputStream fileInputStream)
	{
		System.out.println("singleTry");
		boolean error = false;
		String errorMessage = "";
		long id = 0;
		String name = "";
		String uploadPath = Database.fileUploadPath() + "/" + randomString();
		System.out.println("uploadPath: "+uploadPath);
		int totalLength = 0;
	    try
	    {
	        int read = 0;
	        byte[] bytes = new byte[1024];
	        System.out.println("start copy file");
	        OutputStream out = new FileOutputStream(new File(uploadPath));
	        while ((read = fileInputStream.read(bytes)) != -1)
	        {
	            out.write(bytes, 0, read);
	            totalLength += read;
	        }
	        out.flush();
	        out.close();
	        System.out.println("finish");
	        
	        try
	        {
	        	System.out.println("importing file");
	        	System.out.println(uploadPath);
	        	Derby testDB = Derby.createInMemory();
	        	ImportConfig config = new ImportConfig(new ZipStore(new File(uploadPath)),testDB);
	        	ILCDImport importer = new ILCDImport(config);
	        	importer.run();
	        	ProcessDao processDao = new ProcessDao(testDB);
	    		List<Process> processList = processDao.getAll();
	    		int count = processList.size();
	    		testDB.delete();
	    		if(count!=1)
	    		{
	    			error = true;
	    			errorMessage = "Only one process allowed.";
	    		} else
	    		{
					if(processList.get(0).processType != ProcessType.LCI_RESULT)
					{
						error = true;
						errorMessage = "Process is not aggregated.";
					} else
					{
						String uuid = processList.get(0).refId;
						ProcessDao daoDB = new ProcessDao(Database.getDb());
						Process dbProcess = daoDB.getForRefId(uuid);
						if(dbProcess != null)
						{
							error = true;
							errorMessage = "Process allready exists.";
						}else
						{
							id= processList.get(0).id;
							name = processList.get(0).name;
						}
					}
	    		}
	        	
	        }catch(Exception e)
	        {
	        	e.printStackTrace();
	        	error = true;
	        	errorMessage = "Import failed!";
	        }finally
	        {
	        	File f = new File(uploadPath);
	        	f.delete();
	        }
	    } catch (IOException e)
	    {
	    	e.printStackTrace();
	        error = true;
	        errorMessage = "Internal Error.";
	    }
	    if(!error)
	    {
	    	System.out.println("Uploaded "+totalLength/1000000+"MB");
	    }
	    
	    ImportResponse rtn = new ImportResponse();
	    rtn.error = error;
	    rtn.message = errorMessage;
	    rtn.id = id;
	    rtn.name=name;
	    System.out.println("singletry end");
		return rtn;
	}
	
	@GET
	@Path("delete")
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.TEXT_PLAIN)
	public Response delete(
			@DefaultValue("-1") @QueryParam("id") long id)
	{
		System.out.println("delete");
		System.out.println(id);
		boolean error = false;
	    try
	    {
        	ProcessDao processDao = new ProcessDao(Database.getDb());
    		Process process = processDao.getForId(id);
    		if(process != null)
    			processDao.delete(process);
	        	
	    } catch (Exception e)
	    {
	        error = true;
	    }
	    
	    if(error)
	    {
	    	System.out.println("deleted1");
	    	return Response.serverError().build();
	    }
	    System.out.println("deleted2");
		return Response.ok().build();
	}
	
	private String randomString()
	{
		return RandomStringUtils.random(10, true, true);
	}
	
}

@XmlRootElement
class ImportResponse
{
	public boolean error = false;
	public String message = "";
	public long id;
	public String name;
	public String reference_unit;
	public double reference_amount;
}
