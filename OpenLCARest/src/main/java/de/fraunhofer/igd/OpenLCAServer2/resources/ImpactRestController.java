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
import java.io.UnsupportedEncodingException;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Base64.Decoder;
import java.util.List;
import java.util.regex.Pattern;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.xml.bind.annotation.XmlRootElement;

import org.openlca.core.model.CalculationSetup;
import org.openlca.core.model.Exchange;
import org.openlca.core.model.ImpactCategory;
import org.openlca.core.model.ImpactMethod;
import org.openlca.core.model.Process;
import org.openlca.core.model.ProcessType;
import org.openlca.core.model.ProductSystem;
import org.openlca.core.model.RootEntity;
import org.openlca.core.model.descriptors.ImpactDescriptor;
import org.openlca.core.results.ImpactValue;
import org.openlca.core.results.LcaResult;
import org.openlca.core.model.Parameter;
import org.openlca.io.ilcd.ILCDExport;
import org.openlca.io.ilcd.output.ExportConfig;
import org.openlca.nativelib.NativeLib;

import de.fraunhofer.igd.OpenLCAServer2.Configuration;
import de.fraunhofer.igd.OpenLCAServer2.Database;

import org.openlca.core.database.ImpactMethodDao;
import org.openlca.core.database.ProcessDao;
import org.openlca.core.database.ProductSystemDao;
import org.openlca.core.math.SystemCalculator;
import org.openlca.core.matrix.solvers.JavaSolver;
import org.openlca.core.matrix.solvers.NativeSolver;

@Path("impact")
public class ImpactRestController {
	
	
	public ImpactRestController()
	{
	}
	
	@GET
	@Path("process")
	@Produces(MediaType.APPLICATION_JSON)
	public ProcessResponse process()
	{
		ProcessDao processDao = new ProcessDao(Database.getDb());
		List<Process> processList = processDao.getAll();
		ProcessResponse response = new ProcessResponse();
		for(Process p : processList)
		{
			ProcessResponse.Process rp = new ProcessResponse.Process();
			rp.name = p.name;
			rp.id = p.id;
			response.processList.add(rp);
		}
		
		return response;
	}
	
	private boolean processIsCS1(Process p)
	{
		if(p.category != null && 
				p.category.name.equals("Other materials"))
		{
			String id = p.name.split(" ",2)[0];
			if(id.startsWith("TA")||id.startsWith("TX")||id.startsWith("BT"))
			{
				return true;
			}
		}	
		return false;
	}
	
	private boolean processIsCS2(Process p)
	{
		return !processIsCS1(p);
	}
	
	private List<Process> filterProcessesByIds(ProcessDao list, List<Integer> ids)
	{
		List<Process> rtn = new ArrayList<Process>();
		for(Integer i : ids)
		{
			if(list.contains(i))
			{
				rtn.add(list.getForId(i));
			}
		}
		return rtn;
	}
	
	@GET
	@Path("cs1")
	@Produces(MediaType.APPLICATION_JSON)
	public CS1Response cs1()
	{
		ProcessDao processDao = new ProcessDao(Database.getDb());
		List<Process> processes = processDao.getAll();
		CS1Response response = new CS1Response();
		try
		{
			for(Process p : processes)
			{
				if(processIsCS1(p)||processIsCS2(p))
				{
					CS1Response.Process rp = new CS1Response.Process();
					String split[] = p.name.split(" ",2);
					if(split.length==2 && (split[0].startsWith("TA")||split[0].startsWith("TX")||
							split[0].startsWith("BT")))
					{
						rp.name = split[1];
						rp.id = split[0];
					}
					else
					{
						rp.name = p.name;
						rp.id = ""+p.id;
					}
					rp.intern_id = p.id;
					rp.aggregated = p.processType != ProcessType.UNIT_PROCESS;
					rp.description = p.description;
					if(p.documentation != null && p.documentation.dataGenerator != null)
						rp.dataset_generator = p.documentation.dataGenerator.name;
					if(p.documentation != null && p.documentation.dataSetOwner != null)
						rp.owner = p.documentation.dataSetOwner.name;
					rp.cs1 = !processIsCS2(p);
					rp.uuid = p.refId;
					rp.reference = p.quantitativeReference.amount;
					rp.reference_unit = p.quantitativeReference.flow.name + " (" + 
						p.quantitativeReference.unit.name + ")";
					for(Parameter param : p.parameters)
					{
						if(param.isInputParameter)
						{
							CS1Response.InputParameter inP = 
									new CS1Response.InputParameter();
							inP.name = param.name;
							inP.description = param.description;
							inP.value = param.value;
							rp.inputParameters.add(inP);
						}else
						{
							CS1Response.DependentParameter dP = 
									new CS1Response.DependentParameter();
							dP.name = param.name;
							dP.description = param.description;
							dP.value = param.value;
							dP.formular = param.formula;
							rp.dependentParameters.add(dP);
						}
					}
					for(Exchange e : p.exchanges)
					{
						CS1Response.Flow f = new CS1Response.Flow();
						f.name = e.flow.name;
						f.amount = e.amount;
						f.unit = e.unit.name;
						if(e.isInput)
						{
							rp.inputs.add(f);
						}else
						{
							rp.outputs.add(f);
						}
					}
					response.processList.add(rp);
				}
			}
		} catch(Exception e)
		{
			System.out.println(e.getMessage());
			e.printStackTrace();
		}
		System.out.println("end");
		return response;
	}
	
	@GET
	@Path("processByIds")
	@Produces(MediaType.APPLICATION_JSON)
	public CS1Response processByIds(@QueryParam("ids") String idsString)
	{
		ProcessDao processDao = new ProcessDao(Database.getDb());
		List<Integer> idsList = new ArrayList<Integer>();
		System.out.println("here1");
		String[] ids = idsString.split(Pattern.quote(","));
		for(String id : ids)
			idsList.add(Integer.decode(id));
		System.out.println("here2");
		List<Process> processList = filterProcessesByIds(processDao,idsList);
		System.out.println("here3");
		CS1Response response = new CS1Response();
		try
		{
			for(Process p : processList)
			{
				CS1Response.Process rp = new CS1Response.Process();
				String split[] = p.name.split(" ",2);
				if(split.length==2 && (split[0].startsWith("TA")||split[0].startsWith("TX")||
						split[0].startsWith("BT")))
				{
					rp.name = split[1];
					rp.id = split[0];
				}
				else
				{
					rp.name = p.name;
					rp.id = ""+p.id;
				}
				rp.intern_id = p.id;
				rp.aggregated = p.processType != ProcessType.UNIT_PROCESS;
				rp.description = p.description;
				if(p.documentation != null && p.documentation.dataGenerator != null)
					rp.dataset_generator = p.documentation.dataGenerator.name;
				if(p.documentation != null && p.documentation.dataSetOwner != null)	
					rp.owner = p.documentation.dataSetOwner.name;
				rp.cs1 = !processIsCS2(p);
				rp.uuid = p.refId;
				rp.reference = p.quantitativeReference.amount;
				rp.reference_unit = p.quantitativeReference.flow.name + " (" + 
						p.quantitativeReference.unit.name + ")";
				for(Parameter param : p.parameters)
				{
					if(param.isInputParameter)
					{
						CS1Response.InputParameter inP = 
								new CS1Response.InputParameter();
						inP.name = param.name;
						inP.description = param.description;
						inP.value = param.value;
						rp.inputParameters.add(inP);
					}else
					{
						CS1Response.DependentParameter dP = 
								new CS1Response.DependentParameter();
						dP.name = param.name;
						dP.description = param.description;
						dP.value = param.value;
						dP.formular = param.formula;
						rp.dependentParameters.add(dP);
					}
				}
				for(Exchange e : p.exchanges)
				{
					CS1Response.Flow f = new CS1Response.Flow();
					f.name = e.flow.name;
					f.amount = e.amount;
					f.unit = e.unit.name;
					if(e.isInput)
					{
						rp.inputs.add(f);
					}else
					{
						rp.outputs.add(f);
					}
				}
				response.processList.add(rp);
			}
		} catch(Exception e)
		{
			System.out.println(e.getMessage());
			e.printStackTrace();
		}
		System.out.println("end");
		return response;
	}
	
	@GET
	@Path("execution")
	@Produces(MediaType.APPLICATION_JSON)
	public ImpactResponse res()
	{
		try {
			Thread.sleep(10000);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		ImpactResponse error = new ImpactResponse();
		error.error = true;
		error.errorMessage = "timeout";
		return error;
	}
	
	@GET
	@Path("categories")
	@Produces(MediaType.APPLICATION_JSON)
	public ImpactResponse categories()
	{
		CategoryResponse r = new CategoryResponse();
		ImpactMethodDao methodDao = new ImpactMethodDao(Database.getDb());
		List<ImpactMethod> methods = methodDao.getForName(Configuration.i().getImpactMethod());
		if(methods.size() == 0)
		{
			ImpactResponse error = new ImpactResponse();
			error.error = true;
			error.errorMessage = "Impact method "+Configuration.i().getImpactMethod()+" not found";
			return error;
		}
		ImpactMethod method = methods.get(0);
		for(ImpactCategory c : method.impactCategories)
		{
			CategoryResponse.Result res = new CategoryResponse.Result();
			res.name = c.name;
			r.results.add(res);
		}
		return r;
	}
	
	@GET
	@Path("calculate")
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.TEXT_PLAIN)
	public ImpactResponse calculate(
			@DefaultValue("-1") @QueryParam("id") Integer id,
			@DefaultValue("undefined") @QueryParam("impactMethod") String impactMethod)
	{
		System.out.println("calculate");
		System.out.println("before decode");
		System.out.println(impactMethod);
		Decoder d = Base64.getDecoder();
		byte[] decodedBytes = d.decode(impactMethod);
		String methodDecoded = new String(decodedBytes);
		System.out.println("after decode");
		if(id == -1)
		{
			ImpactResponse error = new ImpactResponse();
			error.error = true;
			error.errorMessage = "Parameter id missing";
			return error;
		}

		ProcessDao processDao = new ProcessDao(Database.getDb());
		if(!processDao.contains(id))
		{
			ImpactResponse error = new ImpactResponse();
			error.error = true;
			error.errorMessage = "Invalid id";
			return error;
		}
		Process process = processDao.getForId(id);
		System.out.println("Process: "+process.name);
		ImpactMethodDao methodDao = new ImpactMethodDao(Database.getDb());
		System.out.println("calculating method");
		System.out.println(methodDecoded);
		List<ImpactMethod> methods = methodDao.getForName(methodDecoded);
		if(methods.size() == 0)
		{
			ImpactResponse error = new ImpactResponse();
			error.error = true;
			error.errorMessage = "Impact method "+methodDecoded+" not found"; 
			return error;
		}
		ImpactMethod method = methods.get(0);
		// Create Production-System
		try
		{
			//LinkingConfig config = new LinkingConfig();
			//config.providerLinking(ProviderLinking.IGNORE_DEFAULTS);
			//config.preferredType(ProcessType.LCI_RESULT);
			//ProductSystemBuilder builder = new ProductSystemBuilder(matrixCache, config);
			//ProductSystem system = builder.build(process);
			ProductSystem system = ProductSystem.of(process);
			
			CalculationSetup setup = CalculationSetup.of(system)
				.withImpactMethod(method);
			SystemCalculator calc = new SystemCalculator(Database.getDb());

			if(NativeLib.isLoaded())
			{
				System.out.println("using native solver");
				calc.withSolver(new NativeSolver());
			}else
			{
				calc.withSolver(new JavaSolver());
			}
			
			//SimpleResult r = calc.calculateSimple(setup);
			LcaResult r = calc.calculate(setup);
			CalculationResponse response = new CalculationResponse();
			for(ImpactValue val : r.getTotalImpactResults())
			{
				ImpactDescriptor desc = val.impact();
				CalculationResponse.Result res = new CalculationResponse.Result();
				System.out.println(desc.name+": "+r.getTotalImpactResult(desc));
				res.name = desc.name;
				res.value = r.getTotalImpactResult(desc);
				res.unit = desc.referenceUnit;
				response.results.add(res);
			}
			return response;
		}catch(Exception e)
		{
			System.out.println("error");
			e.printStackTrace();
			ImpactResponse error = new ImpactResponse();
			error.error = true;
			error.errorMessage = e.getMessage();
			return error;
		}
	}
	
	private File exportEntity(RootEntity entity) throws InterruptedException, NoSuchAlgorithmException
	{
		String time = String.valueOf(System.currentTimeMillis());
	    String filename = entity.name+"."+time+".zip";
	    try {
			filename = java.net.URLEncoder.encode(filename,"UTF-8");
		} catch (UnsupportedEncodingException e) {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			String hash = new String(digest.digest(entity.name.getBytes()));
			filename = hash+"."+time+".zip";
			e.printStackTrace();
		}
		java.nio.file.Path p = Paths.get( Configuration.i().getExportDir(), filename);
		File f = p.toFile();
		ExportConfig config = new ExportConfig(Database.getDb(),f);
		ILCDExport export = new ILCDExport(config);
		export.export(entity);
		export.close();
		return f;
	}
	
	private File exportEntities(List<RootEntity> entities) throws InterruptedException, NoSuchAlgorithmException
	{
		String time = String.valueOf(System.currentTimeMillis());
	    String filename = entities.get(0).name+"."+time+".zip";
	    try {
			filename = java.net.URLEncoder.encode(filename,"UTF-8");
		} catch (UnsupportedEncodingException e) {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			String hash = new String(digest.digest(entities.get(0).name.getBytes()));
			filename = hash+"."+time+".zip";
			e.printStackTrace();
		}
		java.nio.file.Path p = Paths.get( Configuration.i().getExportDir(), filename);
		File f = p.toFile();
		ExportConfig config = new ExportConfig(Database.getDb(),f);
		ILCDExport export = new ILCDExport(config);
		for(RootEntity e : entities)
			export.export(e);
		export.close();
		return f;
	}
	
	@GET
	@Path("exportSystem")
	@Produces(MediaType.APPLICATION_OCTET_STREAM)
	@Consumes(MediaType.TEXT_PLAIN)
	public Response exportSystem(
			@DefaultValue("-1") @QueryParam("id") Integer id) throws NoSuchAlgorithmException
	{
		ProductSystemDao dao = new ProductSystemDao(Database.getDb());
		if(!dao.contains(id))
		{
			return Response.serverError().build();
		}else
		{
			ProductSystem p = dao.getForId(id);
			System.out.println(p.name);
			File f;
			try {
				f = exportEntity(p);
				String name = f.getName();
				return Response.ok(f, MediaType.APPLICATION_OCTET_STREAM)
						.header("Content-Disposition", "attachment; filename=\""+name+"\"")
						.build();
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				return Response.serverError().build();
			}
			
		}
	}
	
	@GET
	@Path("exportProcess")
	@Produces(MediaType.APPLICATION_OCTET_STREAM)
	@Consumes(MediaType.TEXT_PLAIN)
	public Response exportProcess(
			@DefaultValue("-1") @QueryParam("id") Integer id) throws NoSuchAlgorithmException
	{
		ProcessDao dao = new ProcessDao(Database.getDb());
		if(!dao.contains(id))
		{
			return Response.serverError().build();
		}else
		{
			Process p = dao.getForId(id);
			System.out.println(p.name);
			File f;
			try {
				f = exportEntity(p);
				String name = f.getName();
				return Response.ok(f, MediaType.APPLICATION_OCTET_STREAM)
						.header("Content-Disposition", "attachment; filename=\""+name+"\"")
						.build();
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				return Response.serverError().build();
			}
			
		}
	}
	
	@GET
	@Path("exportProcesses")
	@Produces(MediaType.APPLICATION_OCTET_STREAM)
	@Consumes(MediaType.TEXT_PLAIN)
	public Response exportProcesses(
			@QueryParam("ids") String idsString)   throws NoSuchAlgorithmException
	{
		System.out.println(idsString);
		List<Integer> idsList = new ArrayList<Integer>();
		String[] ids = idsString.split(Pattern.quote(","));
		for(String id : ids)
			idsList.add(Integer.decode(id));
		
		ProcessDao dao = new ProcessDao(Database.getDb());
		List<Process> processList = filterProcessesByIds(dao,idsList);
		
		File f = null;
		try {
			f = exportEntities((List<RootEntity>)(List<?>)processList);
			String name = f.getName();
			System.out.println(name);
			return Response.ok(f, MediaType.APPLICATION_OCTET_STREAM)
					.header("Content-Disposition", "attachment; filename=\""+"export.zip"+"\"")
					.build();
		} catch (InterruptedException e) {
			e.printStackTrace();
			return Response.serverError().build();
		}
	}
	
	@GET
	@Path("exportEveryProcess")
	@Produces(MediaType.APPLICATION_OCTET_STREAM)
	@Consumes(MediaType.TEXT_PLAIN)
	public Response exportEveryProcess() throws NoSuchAlgorithmException
	{
		ProcessDao dao = new ProcessDao(Database.getDb());
		List<Process> processList = dao.getAll();
		List<Process> filtered = new ArrayList<Process>();
		for(Process p : processList)
			if(processIsCS1(p)||processIsCS2(p))
				filtered.add(p);
		
		File f = null;
		try {
			f = exportEntities((List<RootEntity>)(List<?>)filtered);
			String name = f.getName();
			System.out.println(name);
			return Response.ok(f, MediaType.APPLICATION_OCTET_STREAM)
					.header("Content-Disposition", "attachment; filename=\""+"export.zip"+"\"")
					.build();
		} catch (InterruptedException e) {
			e.printStackTrace();
			return Response.serverError().build();
		}
		
	}
	
	@GET
	@Path("productSystems")
	@Produces(MediaType.APPLICATION_JSON)
	public ProductSystemResponse productSystems()
	{
		ProductSystemDao dao = new ProductSystemDao(Database.getDb());
		List<ProductSystem> systems = dao.getAll();
		ProductSystemResponse response = new ProductSystemResponse();
		for(ProductSystem p : systems)
		{
			ProductSystemResponse.ProductSystem rp = new ProductSystemResponse.ProductSystem();
			rp.name = p.name;
			rp.id = p.id;
			response.systemList.add(rp);
		}
		
		return response;
	}
}


@XmlRootElement
class ImpactResponse
{
	public boolean error = false;
	public String errorMessage = "";
}

@XmlRootElement
class ProcessResponse extends ImpactResponse
{
	public ProcessResponse() {};
	
	@XmlRootElement
	public static class Process
	{
		public String name;
		public long id;
		
	}
	
	public List<Process> processList = new ArrayList<Process>();
}

@XmlRootElement
class ProductSystemResponse extends ImpactResponse
{
	public ProductSystemResponse() {};
	
	@XmlRootElement
	public static class ProductSystem
	{
		public String name;
		public long id;
		
	}
	
	public List<ProductSystem> systemList = new ArrayList<ProductSystem>();
}

@XmlRootElement
class Flow
{
	public Flow() {};
	
	@XmlRootElement
	public static class Process
	{
		public String name;
		public String id;
		public long intern_id;
	}
	
	public List<Process> processList = new ArrayList<Process>();
}


@XmlRootElement
class CS1Response extends ImpactResponse
{
	public CS1Response() {};
	
	@XmlRootElement
	public static class Flow
	{
		public String name;
		public double amount;
		public String unit;
	}
	
	@XmlRootElement
	public static class InputParameter
	{
		public String name;
		public double value;
		public String description;
	}
	
	@XmlRootElement
	public static class DependentParameter
	{
		public String name;
		public String formular;
		public double value;
		public String description;
	}
	
	@XmlRootElement
	public static class Process
	{
		public String name;
		public String id;
		public long intern_id;
		public String owner;
		public String dataset_generator;
		public String description;
		public String uuid;
		public double reference;
		public String reference_unit;
		public boolean aggregated;
		public boolean cs1;
		public List<Flow> inputs = new ArrayList<Flow>();
		public List<Flow> outputs = new ArrayList<Flow>();
		public List<InputParameter> inputParameters = new ArrayList<InputParameter>();
		public List<DependentParameter> dependentParameters = new ArrayList<DependentParameter>();
	}
	
	public List<Process> processList = new ArrayList<Process>();
}

@XmlRootElement
class CalculationResponse extends ImpactResponse
{
	public CalculationResponse() {};
	
	@XmlRootElement
	public static class Result
	{
		public String name;
		public String unit;
		public double value;
	}
	
	public List<Result> results = new ArrayList<Result>();
}

@XmlRootElement
class CategoryResponse extends ImpactResponse
{
	public CategoryResponse() {};
	
	@XmlRootElement
	public static class Result
	{
		public String name;
	}
	
	public List<Result> results = new ArrayList<Result>();
}
