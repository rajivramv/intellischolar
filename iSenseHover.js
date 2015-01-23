var dataRcvd = new Array();
var gData = new Array();
var pData = new Array();
var altCode = 0;
gTable = { 'startCount':1, 'totalCount':0, 'retMax':20 };//Will be initialized on document ready
pTable = { 'startCount':1, 'totalCount':0, 'retMax':20 };//Will be initialized on document 

function dataClass(id,typ,summ){
  this.ID = id;
  this.Type = typ;
  this.summ = summ;
}

var apiKey = "6319ed9c17f1149e4ad61aad4462427e";
var context;
var authToken;
var searchTerm;
var searchUrl;
var sortable=[];
var subscription;
var pii;
var piiArray=[];
//var currentPageAuthorsArray;
var coverDates=[];
var TopTenAuths=[]; 
var TopTenPubs=[];
var TopTenAffs=[];
var yearTrend=[];
//var currentAuId=[];
var auIdTemp;		
var x;
var count;			
		
var params = {};
var requestHeaders = {};
requestHeaders['X-ELS-APIKey'] = apiKey;
requestHeaders['X-ELS-ResourceVersion'] = "XOCS";
requestHeaders['X-ELS-Authtoken'] = "";
requestHeaders['Accept'] = "application/json";
params[gadgets.io.RequestParameters.HEADERS] = requestHeaders;

//---------------------------------------------------------------------------//
	function clear(){
			  try{
				  console.clear(); //for Firebug/general
			  }catch(a){
				  try{
					  console._commandLineAPI.clear(); //for Chrome
				  }catch(b){
					  try{
						  console._inspectorCommandLineAPI.clear(); // forSafari
					  }catch(c){
						  console.log(new Array(50).join('\n'));
						  }
					  }
			  }
		}
		
		clear();
//---------------------------------------------------------------------------//

function openPopup(content){
  var popup = window.open("","","location=no,menubar=no,toolbar=no,left=200","");
  popup.document.write("<html><head><title>XML</title></head>");
  popup.document.write("<body><form><div>");
  //popup.document.write(data.toString());
  popup.document.write(content);
  popup.document.write("</div></form></body></html>");
  //popup.document.close();
}

//---------------------------------------------------------------------------//

function showJson(data){
  var rs = JSON.stringify(data);
  rs = rs.replace(/",/g,"\",<br>"); //Replace all [",] with [",<br>]
  rs = rs.replace(/\\"/g,"\""); //Replace all [\"] with ["]
  rs = rs.replace(/,"/g,",<br>\"");
  openPopup(rs);
}

//---------------------------------------------------------------------------//
JSON.stringify = JSON.stringify || function (obj) {
    var t = typeof (obj);
    if (t != "object" || obj === null) {
        // simple data type
        if (t == "string") obj = '"'+obj+'"';
        return String(obj);
    }
    else {
        // recurse array or object
        var n, v, json = [], arr = (obj && obj.constructor == Array);
        for (n in obj) {
            v = obj[n]; t = typeof(v);
            if (t == "string") v = '"'+v+'"';
            else if (t == "object" && v !== null) v = JSON.stringify(v);
            json.push((arr ? "" : '"' + n + '":') + String(v));
        }
        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    }
};
//---------------------------------------------------------------------------//

function onSelectContextCallback(context){
			TopTenAuths.length=0;
			TopTenPubs.length=0;
			TopTenAffs.length=0;
			clear();
			authToken = context.secureAuthtoken;
			console.log("Updated Auth Token: "+authToken);
			requestHeaders['X-ELS-Authtoken'] = authToken;
			try{
			subscription = context.entitlement;
			pii=context.pii;
			}catch(err){}
			

			var tempSearchUrl = "http://api.elsevier.com/content/search/index:SCIDIR?query=title-abs-key("+searchTerm+")&count=1&start=0&view=STANDARD&field=authors,prism:publicationName,prism:coverDate,pii&sort=-numcitedby,-date,+name";  
			findCountSearch(tempSearchUrl);
}
//---------------------------------------------------------------------------//
		function findCountSearch(tempSearchUrl){
				gadgets.sciverse.makeRequest(tempSearchUrl, findCountSearchCallback, params);
			}
//--------------------------------------------------------------------------//
		function findCountSearchCallback(data){
			//showJson(data);
			try{
			var objtext = data["text"];				
			var textJson = gadgets.json.parse(objtext);
			var temp = textJson["search-results"];
			count=temp["opensearch:totalResults"];
			console.log("Count = "+count);
			if (count>1000){
				count=1000;
				console.log("Reset Count = "+count);
				}
			searchTopAuthorsPubs(searchTerm); //Make thess calls from wherever you want, based on performance of your gadget 
			searchScopusforAff(searchTerm);	
			}catch(err){}
			
			}	
//---------------------------------------------------------------------------//
function searchTopAuthorsPubs(searchTerm){						
				console.log("########## Now running SD search... ########## ");
				searchUrl = "http://api.elsevier.com/content/search/index:SCIDIR?query=title-abs-key("+searchTerm+")&count="+count+"&start=0&view=STANDARD&field=authors,prism:publicationName,prism:coverDate,prism:issn,pii&sort=-numcitedby,-date,+name"; 
				//gadgets.sciverse.makeContentApiRequest (searchUrl, searchTopAuthorsPubsCallback, requestHeaders);
				gadgets.sciverse.makeRequest(searchUrl, searchTopAuthorsPubsCallback, params);				
		}
//---------------------------------------------------------------------------//
function searchTopAuthorsPubsCallback(data){
			var authorsList;
			var pubNamesList;
			var dateMap={};
			var dateArray=[];
			var dateInstance;
			var pubNamesMap={};
			//showJson(data);
			//try{
			var objtext = data["text"];
			//openPopup(objtext);	
			var textJson = gadgets.json.parse(objtext);
			var entries = textJson["search-results"]["entry"];
			//alert(entries.length);
			$.each(entries, function(key, entry){
			//console.log(typeof entry);
			  if (typeof entry !== 'undefined'){
				try{
					var authors = entry["authors"];
						//authors = authors.replace("undefined",'');
						$.trim(authors);
						authorsList = authorsList + authors + " | ";
						$.trim(authorsList);
					var pubNames = entry["prism:publicationName"];
						//pubNames = pubNames.replace("undefined",'');
						$.trim(pubNames);
						pubNamesMap[pubNames]=entry["prism:issn"];
						console.log(pubNamesMap);
						pubNamesList = pubNamesList + pubNames + " | ";
						$.trim(pubNamesList);
					var piiString=(entry["pii"]).split(/[:]+/).pop();
						//console.log(piiString);
						piiArray.push(piiString);	
					
						
					try{
						var year = parseInt((entry["prism:coverDate"]).split(/[-]+/).shift(),10);
						if (typeof year !== 'undefined'){	
							coverDates.push(year)	
						}
					}catch(err){console.log("Article has no CoverDate!");}
										
				}catch(err){}
			  }
			});
			console.log(piiArray);	
			console.log("----------------------------------------------------------------------------")
			console.log(coverDates);	
			console.log("----------------------------------------------------------------------------")
			$.each(coverDates, function(ind,val){
						try{
							if(val!="undefined"){ 
				  				dateInstance = $.grep(coverDates, function (el,i) { return el === val; }).length;
				  				dateMap[val]=dateInstance;
								//console.log(dateArray[ind][1]);	
							}
						}catch(err){}
				});
			for(var yr in dateMap)
				dateArray.push([yr, dateMap[yr]]);
			if (dateArray.length > 2){		
				dateArray.sort(function(a, b) {return a[0] - b[0]});
			}
			$.each(dateArray,function(x,y){
				console.log(dateArray[x][0]+" : "+dateArray[x][1]);
				yearTrend.push({"year": dateArray[x][0], "article": dateArray[x][1]});
				}
			);
			console.log(yearTrend);			
			$(function () {				
			  	eval($('#code').text());
			  	prettyPrint();
			});
			console.log("----------------------------------------------------------------------------")
			authorsList = authorsList.replace("undefined",'');	
			//authorsList = authorsList.replace("undefined | ",'');
			pubNamesList = pubNamesList.replace("undefined",'');	
			//pubNamesList = pubNamesList.replace("undefined | ",'');	
			//openPopup(authorsList);
			//openPopup(pubNamesList);
			//authorsList = authorsList.replace(/\|/g,"<br>");
			//authorsList = authorsList.replace(/[^a-zA-Z.| ]/g, '')
			authorsList = authorsList.replace(/[,]/g, '')
			//openPopup(authorsList);
			//pubNamesList = pubNamesList.replace(/[^a-zA-Z.| ]/g, '')
			pubNamesList = pubNamesList.replace(/[,]/g, '')
			//openPopup(pubNamesList);
			//var authorsNameArray = $.trim(authorsList).split(/\s*\|\s*/);
			var authorsNameArray = $.map(authorsList.split("|"), $.trim);
			//openPopup(authorsNameArray.join("<br>"));			
			authorsNameArray.sort().shift();
			//openPopup(authorsNameArray.join("<br>"));
			
			var pubNamesArray = $.map(pubNamesList.split("|"), $.trim);
			pubNamesArray.sort().shift();
			//openPopup(pubNamesArray.join("<br>"));
			
			console.log("####################### TOP 10 AUTHORS #######################");
			showTopTen(authorsNameArray);
			var minCount=Math.min(10,sortable.length);
			if (minCount>=3){
			  for(var i=0; i<minCount; i++) {
				var dom=""; 
				dom="#a"+i+"1";
				TopTenAuths[i]=sortable[i][0];
				$(dom).html(TopTenAuths[i]).fadeIn("slow");
				dom="#a"+i+"3";
				var html="";
				html="";				
				html="<a href=http://www.sciencedirect.com/science/quicksearch?query=TITLE-ABSTR-KEY("+ searchTerm +")+and+AUTHORS("+ (TopTenAuths[i]).replace(/[ ]/g, "+").trim() +") target=&quot;_blank&quot;>"+(sortable[i][1])+"</a>"
				$(dom).html(html).fadeIn("slow");								
			  }
			}else {
			  for(var i=0; i<10; i++) {
				var dom=""; 
				dom="#a"+i+"1";			  
				$(dom).html("Insufficient Data!").fadeIn("slow");	
			  }
			}
			console.log(TopTenAuths);
				
			
			console.log("####################### TOP 10 JOURNALS #######################");
			showTopTen(pubNamesArray); 
			var minCount=Math.min(10,sortable.length);
			if (minCount>=3){
			  for(var i=0; i<minCount; i++) {
				var dom="";
				var html=""; 
				dom="#p"+i+"1";
				TopTenPubs[i]=sortable[i][0];
				html="<a href=http://www.sciencedirect.com/science/journal/"+pubNamesMap[(TopTenPubs[i]).trim()]+" target=&quot;_blank&quot;>"+TopTenPubs[i]+"</a>"
				$(dom).html(html).fadeIn("slow");
				dom="";
				html="";
				dom="#p"+i+"2";
				html="<a href=http://www.sciencedirect.com/science/quicksearch?query=TITLE-ABSTR-KEY("+ searchTerm +")+and+SRCTITLEPLUS("+ (TopTenPubs[i]).replace(/[ ]/g, "+").trim() +") target=&quot;_blank&quot;>"+(sortable[i][1])+"</a>"
				$(dom).html(html).fadeIn("slow");
								  
			  }
			}else {
			  for(var i=0; i<10; i++) {
				var dom="";
				dom="#p"+i+"1";			  
				$(dom).html("Insufficient Data!").fadeIn("slow");	
			  }
			}
			
			console.log(TopTenPubs);
			console.log("#########################################################");	
			
			delete data;
			delete textJson;
			delete entries;
			delete authors;
			delete pubNames;
			delete data;
			delete rs;
			
			//}catch(err){}
			
		} 
//---------------------------------------------------------------------------//
function searchScopusforAff(searchTerm){
				console.log("########## Now running SCOPUS search... ########## ");
				searchUrl = "http://api.elsevier.com/content/search/index:SCOPUS?query=title-abs-key("+searchTerm+")&count=200&start=0&sort=-numcitedby,-date,+name&view=COMPLETE";// &field=affiliation&sort=-numcitedby"; 
				gadgets.sciverse.makeRequest(searchUrl, searchScopusforAffCallback, params);
		}
//---------------------------------------------------------------------------//
function searchScopusforAffCallback(data){
	var affList;
	//showJson(data);
	//try{
	var objtext = data["text"];				
	var textJson = gadgets.json.parse(objtext);
	var entries = textJson["search-results"]["entry"];
	//showJson(entries);

	$.each(entries, function(key, entry){
	  //console.log(typeof entry);
	  if (typeof entry !== 'undefined'){
		try{	
			var affiliation = entry["affiliation"];
			//console.log("#########################################################");
			
				$.each(affiliation, function(k, e){
					//console.log(typeof e);
					if (typeof e !== 'undefined'){
						try{
							var affNames= e["affilname"];
							//$.trim(affNames);						
							affNames = affNames.split(/[|]+/).shift();
							//console.log(affNames);
							//$.trim(affNames);
							affList = affList + affNames + " | ";
							//$.trim(affList);
						}catch(err){}
					}
				});				
		}catch(err){}
	  }
	});
	affList=affList.replace("undefined",'');
	//alert("All right");
	//console.log(affList);	
	var affNamesArray = $.map(affList.split("|"), $.trim);
	affNamesArray.sort().shift();
	//openPopup(affNamesArray.join("<br>"));	
	console.log("####################### TOP 10 INSTITUTE #######################");
	showTopTen(affNamesArray);
	var minCount=Math.min(10,sortable.length);
	if (minCount>=3){
	  for(var i=0; i<minCount; i++) {
		var dom="";
		var html=""; 
		dom="#i"+i+"1";
		TopTenAffs[i]=sortable[i][0];				
		$(dom).html(TopTenAffs[i]).fadeIn("slow");
		dom="";
		html="";
		dom="#i"+i+"2";
		html="<a href=http://www.sciencedirect.com/science/quicksearch?query=TITLE-ABSTR-KEY("+ searchTerm +")+and+AFFILIATION("+ (TopTenAffs[i]).replace(/[ ]/g, "+").trim() +") target=&quot;_blank&quot;>"+(sortable[i][1])+"</a>"
		$(dom).html(html).fadeIn("slow");
						  
	  }
	}else {
			  for(var i=0; i<10; i++) {
				var dom=""; 
				dom="#i"+i+"1";			  
				$(dom).html("Insufficient Data!").fadeIn("slow");	
			  }
			}
	
	console.log(TopTenAffs);
	
	
	
	
	console.log(subscription);
	if (subscription==="SUBSCRIBED"){
		try{
			var auidSearchURL = "http://api.elsevier.com/content/search/index:SCOPUS?query=title-abs-key("+searchTerm.trim()+")&count=200&sort=-numcitedby,+name,-date&start=0&field=authid,affilname,afid&view=STANDARD";// &field=affiliation&sort=-numcitedby"; 
			gadgets.sciverse.makeRequest(auidSearchURL, allAuIdsearchCallback, params);
			}catch(e){}				
		  
	  }
	//}catch(err){}
}
//---------------------------------------------------------------------------//
function showTopTen(NameArray){
			var instances;			
			var Map={};			
			//var MapJSON = [{Name:'',count:''}];
			try{
			$.each(NameArray, function(index, value) {
				//alert(index+":"+value);
				if(value!="undefined"){
				try{
				  instances = $.grep(NameArray, function (el,i) { return el === value; }).length;
				  Map[value] = instances;
				  //$.extend(MapJSON, {Name:value,count:instances});
				  //MapJSON.push({Name:value,count:instances});
				}catch(e){}
				}
			});
			}catch(err){}
			//console.log(Map);
			//function SortByCount(a,b){ 
				//return b.value - a.value; 
				//}

			//Map.sort(SortByCount);
			//console.log(Map);
			sortable.length=0;
			for(var Name in Map)
				sortable.push([Name, Map[Name]]);
			console.log("Sortable Array Length: "+sortable.length);
			if(sortable.length>=10){	
			sortable.sort(function(a, b) {return b[1] - a[1]});
			//console.log(sortable);
			for (var i=0; i<10; i++){
				console.log(sortable[i][0]+":"+sortable[i][1]);
			}
			}
			delete Map;
			//delete MapJSON;	
			delete NameArray;
		}
//---------------------------------------------------------------------------//
function allAuIdsearchCallback(obj){
				//showJson(obj);
				auIdTemp="";
				var TopTenAuthsMap={};
				var TopTenAffsMap={};				
				try{
				var objtext = obj["text"];				
				var textJson = gadgets.json.parse(objtext);
				var entries = textJson["search-results"]["entry"];
				  try{
					   $.each(TopTenAuths,function(index,value){
						  try{
							  value.trim();
							  authLName=(value.trim().split(/[ ]+/).pop().trim());
							  try{
							  $.each(entries, function(key, entry){
								if (typeof entry !== 'undefined'){				  
									var author = entry["author"];
								  try{						
									$.each(author, function(k, e){ 
										if (typeof e !== 'undefined'){
											try{
												if (typeof e["authname"] !== 'undefined'){
												var authLNameTemp = ((e["authname"]).split(/[,]+/).shift().trim());
												}
											}catch(a){}
											  if(authLNameTemp === authLName){
												  //console.log("Match Found!");
												  var auIdTemp=e["authid"];
												  //console.log(auIdTemp);
												  TopTenAuthsMap[value] = auIdTemp;
												  
												  throw(errA);
											  }
										}
									  });
								  }catch(b){}
								}
							  });
							}catch(er){}
							  
						  }catch(errA){delete value; delete authLName; delete authLNameTemp; delete auIdTemp;}
						
					});
					
					console.log(TopTenAuthsMap);					
					
					}catch(error){}
				  
				 	//console.log(TopTenAffs);
					try{
					   $.each(TopTenAffs,function(index,value){
						  try{
							  value.trim();						  
							  //console.log(value);
							  //console.log("#########################################");
							  try{
							  $.each(entries, function(key, entry){
								if (typeof entry !== 'undefined'){				  
									var affiliation = entry["affiliation"];
								  try{						
									$.each(affiliation, function(k, e){ 
										//console.log(e["affilname"]);
										if (typeof e !== 'undefined'){
											try{
												if (typeof e["affilname"] !== 'undefined'){
												var affTemp = ((e["affilname"]).split(/[|]+/).shift().trim());					
												//console.log(affTemp);
												affTemp.trim();
												value.trim();
												}
											}catch(a){}
											  if($.trim(affTemp) === $.trim(value)){
												  //console.log("Match Found!");
												  var affIdTemp=e["afid"];
												  //console.log(affIdTemp);
												  TopTenAffsMap[value] = affIdTemp;
												  
												  throw(errB);
											  }
										}
									  });
								  }catch(b){}
								}
							  });
							}catch(er){}
							  
						  }catch(errB){delete value; delete affTemp; delete affIdTemp;}
						
					});
					console.log(TopTenAffsMap);
					
					}catch(error){}

					
					
				}catch(err){}
				
				var topAuIdArray=[];
					for(var val in TopTenAuthsMap){
						topAuIdArray.push([TopTenAuthsMap[val], val]);
						$.each(TopTenAuths, function(index, entry){	
							if (val === entry){
									var dom=""; 
									var html=""; 
									var text="";
									dom="#a"+index+"1";
									text=$(dom).text();
									html="<a href=http://www.scopus.com/authid/detail.url?authorId="+(TopTenAuthsMap[val]).trim()+" target=&quot;_blank&quot;>"+(text)+"</a>"								
									$(dom).html(html).fadeIn("slow");
									
									dom=""; 
									html=""; 									
									dom="#a"+index+"4";									
									html="<a href=http://www.scopus.com/authid/detail.url?authorId="+(TopTenAuthsMap[val]).trim()+" target=&quot;_blank&quot;>"+((TopTenAuthsMap[val]).trim())+"</a>"								
									$(dom).html(html).fadeIn("slow");
								}
							
							});
					}
					
					console.log(topAuIdArray);
				
				var topAffIdArray=[];
					for(var val in TopTenAffsMap){
						topAffIdArray.push([TopTenAffsMap[val], val]);
						$.each(TopTenAffs, function(index, entry){	
							if (val === entry){
									var dom=""; 
									var html=""; 
									var text="";
									dom="#i"+index+"1";
									text=$(dom).text();
									html="<a href=http://www.scopus.com/affil/profile.url?afid="+(TopTenAffsMap[val]).trim()+" target=&quot;_blank&quot;>"+(text)+"</a>"
									$(dom).html(html).fadeIn("slow");									
								}

							});
					}
					
					console.log(topAffIdArray);
				
					
				
				$.each(topAuIdArray, function(i, v){
						//console.log("Searching against: "+v[0]);
						var auId2AffSearchURL = "http://api.elsevier.com/content/author/AUTHOR_ID:"+parseInt((v[0]),10)+"?view=ENHANCED";
						//&field=document-count,citedby-count,affiliation,h-index
						gadgets.sciverse.makeRequest(auId2AffSearchURL, auId2AffSearchCallback, params);												  
						
						});
				
				
				//Here add Show profile anchors using jQuery	
				//});
			delete obj;
			delete textJson;
			delete entries;
			delete author;
			delete TopTenAuthsMap;
			delete TopTenAuths;
			delete TopTenAffsMap;
			delete TopTenAffs;
			}
//---------------------------------------------------------------------------//
function auId2AffSearchCallback(auData){
				
				var auDatatext = auData["text"];				
				var auDatatextJson = gadgets.json.parse(auDatatext);
				
				var coredata=auDatatextJson["author-retrieval-response"]["coredata"];
				var auId=(coredata["dc:identifier"]).split(/[:]+/).pop();
				var docCount=coredata["document-count"];
				var citebyCount=coredata["cited-by-count"];
				var hIndex=auDatatextJson["author-retrieval-response"]["h-index"];				
				//var auNames=auDatatextJson["author-retrieval-response"]["author-profile"]["name-variant"];
				var afId=auDatatextJson["author-retrieval-response"]["author-profile"]["affiliation-current"]["affiliation"]["@affiliation-id"]
				var parentAfId= auDatatextJson["author-retrieval-response"]["author-profile"]["affiliation-current"]["affiliation"]["@parent"];
				var afName= auDatatextJson["author-retrieval-response"]["author-profile"]["affiliation-current"]["affiliation"]["ip-doc"]["afdispname"]
				var af="";
				if (typeof parentAfId !== 'undefined'){ af = parentAfId;}else{ af= afId;}
				/*$.each(auNames, function(index, name){
					var surname=name["surname"];
					var givenName=name["given-name"];
					var fullName= $.trim(givenName)+" "+$.trim(surname);
					fullName.trim();*/
					
					
					for(var i=0;i<10;i++){
						var dom="#a"+i+"4";	
						if ($(dom).text().trim() === auId.trim()){
							dom="";
							html="";
							dom="#a"+i+"1";							
							html="&nbsp;<span class='subscript'>("+hIndex+")</span>"
							$(dom).append(html);	
							
							dom="";
							html="";
							dom="#a"+i+"2";
							html="<a href=http://www.scopus.com/affil/profile.url?afid="+(af).trim()+" target=&quot;_blank&quot;>"+afName+"</a>&nbsp;<span class='subscript'>("+(af).trim()+")</span>"								
							$(dom).html(html).fadeIn("slow");
							
							dom="";
							html="";
							dom="#a"+i+"3";
							html="&nbsp;/&nbsp;<a href=http://www.scopus.com/search/submit/author.url?authorId="+(auId).trim()+" target=&quot;_blank&quot;>"+docCount+"</a>"
							$(dom).append(html);
							
							dom="";
							html="";
							dom="#a"+i+"4";
							html="<br><span class='subscript'>("+citebyCount.trim()+")</span>"								
							$(dom).append(html);
														
						}
					}
					
					//});
				
					//http://www.scopus.com/search/submit/author.url?authorId=6603550689
				
				
				console.log(auId+" | "+docCount+" | "+citebyCount+" | "+hIndex+" | "+af+" | "+afName);
			}
//---------------------------------------------------------------------------//
function executeAuthorPubSearch(currentAuthor){					
			gadgets.ScienceDirect.executeSearch("\""+currentAuthor+"\") AND AUTHORS(\""+currentAuthor+"\"");			
		}
function executeSDsearch(term,author){
	gadgets.ScienceDirect.executeSearch(term +") AND AUTHORS("+author);
}
//---------------------------------------------------------------------------//
function displayManager(type) {
  if (type == 'g') {
    var table = gTable;
    var data = gData;
    $('#g_table_container').html('<br/><br/><br/><br/><br/><br/><img align="middle" src="http://courtesydesigns.com/CfS/ajax-loader-round.gif"/>');
    //$('#g_table_loader').show();
  }
  else if (type == 'p') {
    var table = pTable;
    var data = pData;
    $('#p_table_container').html('<br/><br/><br/><br/><br/><br/><img align="middle" src="http://courtesydesigns.com/CfS/images/ajax-loader-round.gif"/>');
    //$('#p_table_loader').show();
  }

  for (i=table['startCount'];(i<table['startCount']+table['retMax'])&&(i<=table['totalCount']);i++) {
    if (typeof data[i-1] == 'undefined' || data[i-1].hasSumm == 0 ) {
      console.log('inside dM');
      getData (type);
      return 0;
    }
  }
  displayTable(type);
  displayNavigator(type);
}
//---------------------------------------------------------------------------//
function getData (type) {
  if (altCode == 1) {
    altgetData(type);
    return 0;
  }
  status = -1;   //status code: -2:timed_out -1:initialized 0:ajax_error 1:success
  dataReturned = 0;
  if (type == 'g')
  {
    startCount = gTable['startCount'];
    retMax = gTable['retMax'];
    webEnv = dataRcvd['gWebEnv'];
    queryKey = dataRcvd['gQueryKey'];
    $.ajax({
      type: 'GET',
      url: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&version=2.0&retstart=' + startCount + '&retmax=' + retMax + '&WebEnv=' + webEnv +'&query_key=' + queryKey,
      success: function(data){
        //console.log(data);
        try {$(data).find('DocumentSummary');}catch(e){status = 0;}
        if (status != 0){
          status = 1;
          $(data).find('DocumentSummary').each(function(i,e){try{
            console.log(startCount-1+i);
            gData[startCount-1+i] = new dataClass($(this).attr('uid'),'Gene',{
              'Gene Id' : $(this).attr('uid'),
              'Name': $(this).contents('Name').text(),
              'Organism': $(this).contents('Orgname').text(),
              'Description': $(this).contents('Description').text(),
              'Genetic Source': $(this).contents('GeneticSource').text(),
              'Alias' : $(this).contents('OtherAliases').text(),
              'Other Designations' : $(this).contents('OtherDesignations').text(),
              'Tax ID' : $(this).contents('TaxID').text()
            });
            dataReturned = i+1;
            gData[startCount-1+i].hasSumm = 1;
          }catch (err){status=0;}
          });
        }
      },
      error: function(foo,textStatus,errorThrown) {
        if (textStatus == 'timeout') {
          status = -2;
        }
        else {status = 0;}
      },
      complete: function() {
        if (status == 1) {
          for(i=startCount;i<dataReturned;i++){
            for (var x in gData[i].summ) {
             if (gData[i-1].summ[x] == '\/s' || gData[i-1].summ[x] == '') gData[i-1].summ[x] = '-';
            }
          }
        displayTable(type);
        displayNavigator(type);
        }
        else if (status == -2) {
          $('#g_table_container').append('<br/><br/><br/>This is taking longer than usual. Check your connections.');
        }
        else if (status == 0) {
          $('#g_table_container').append('<br/><br/><br/>There seems to be some problem with the data received. Check your connections or try again later.')
        }
      }
    });
  }
  else if (type == 'p'){
    startCount = pTable['startCount'];
    retMax = pTable['retMax'];
    webEnv = dataRcvd['pWebEnv'];
    queryKey = dataRcvd['pQueryKey'];
    $.ajax({
      type: 'GET',          //consider beforeSend
      url: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=protein&version=2.0&retstart=' + startCount + '&retmax=' + retMax + '&WebEnv=' + webEnv +'&query_key=' + queryKey,
      success: function(data){
        //console.log(data);
        try {$(data).find('DocumentSummary');} catch(e){status = 0;}
        if (status != 0){
          status = 1;
          $(data).find('DocumentSummary').each(function(i,e){ try{
            pData[startCount-1+i] = new dataClass($(this).attr('uid'),'Protein',{
              'GI': $(this).contents('Gi').text(),
              'Accession': $(this).contents('Extra').text(),
              'Title': $(this).contents('Title').text(),
              'Organism': $(this).contents('Organism').text(),
              'Length': $(this).contents('SLen').text(),
              'Comment': $(this).contents('Comment').text()
            });
            dataReturned = i+1;
            pData[startCount-1+i].hasSumm = 1;
          }catch (err){status = 0};
          });
        }
      },
      error: function(foo,textStatus,thrownError) {
        if (textStatus == 'timeout') {
          status = -2;
        }
        else {status = 0;}
      },
      complete: function() {
        if (status == 1) {
          for(i=startCount;i<dataReturned;i++) {
            for (var x in pData[i].summ) {
              if (pData[i-1].summ[x] == '\/s' || pData[i-1].summ[x] == '') pData[i-1].summ[x] = '-';
            }
          }
        displayTable(type);
        displayNavigator(type);
        }
        else if (status == -2) {
          $('#p_table_container').append('<br/><br/><br/>This is taking longer than usual. Check your connections.');
        }
        else if (status == 0) {
          $('#p_table_container').append('<br/><br/><br/>There seems to be some problem with the data received. Check your connections or try again later.')
        }
      }
    });
  }
}
//---------------------------------------------------------------------------//
function altgetData (type) {
  status = -1;   //status code: -2:timed_out -1:initialized 0:ajax_error 1:success
  console.log('inside altgetData');
  dataReturned = 0;
  console.log(type);
  if (type == 'g')
  {

    startCount =  gTable['startCount'];
    gArg['retmax'] = gTable['totalCount'];
    gArg['start'] = gTable['startCount']-1;
    gArg['max'] =  gTable['retMax'];
    $.ajax({
      type: 'GET',
      url: 'http://entrezajax.appspot.com/esearch+esummary?callback=?',
      data: gArg,
      dataType: 'jsonp',
      timeout: 10000,
      success: function(data){
        //console.log(data);
        try{
          if (data.entrezajax.error == 'true') {throw 0;}
          dataReturned = data.result.length;
          status = 1;
          for (i=0;i<dataReturned;i++) {
            gData[startCount-1+i] = new dataClass(data.result[i].Id,'Gene',{
              'Gene Id' : data.result[i].Id,
              'Name': data.result[i].Name,
              'Organism': data.result[i].Orgname,
              'Description': data.result[i].Description,
              'Genetic Source': data.result[i].GeneticSource,
              'Alias' : data.result[i].OtherAliases,
              'Other Designations' : data.result[i].OtherDesignations,
              'Tax ID' : data.result[i].TaxID
            });
            gData[startCount-1+i].hasSumm = 1;
          }
        } catch (err) {status = 0;}
      },
      error: function(foo,textStatus,errorThrown) {
        if (textStatus == 'timeout') {
          status = -2;
        }
        else {status = 0;}
      },
      complete: function() {
        if (status == 1) {
          for(i=startCount;i<dataReturned;i++){
            for (var x in gData[i].summ) {
             if (gData[i-1].summ[x] == '\/s' || gData[i-1].summ[x] == '') gData[i-1].summ[x] = '-';
            }
          }
        displayTable(type);
        displayNavigator(type);
        }
        else if (status == -2) {
          $('#g_table_container').append('<br/><br/><br/>This is taking longer than usual...Check your connections');
        }
        else if (status == 0) {
          $('#g_table_container').append('<br/><br/><br/>There seems to be some problem with the data received...Check your connections or try again later')
        }
      }
    });
  }
  if (type == 'p'){
    console.log('inside altGetdata g');
    startCount =  pTable['startCount'];
    pArg['retmax'] = pTable['totalCount'];
    pArg['start'] = pTable['startCount']-1;
    pArg['max'] =  pTable['retMax'];
    $.ajax({
      type: 'GET',
      url: 'http://entrezajax.appspot.com/esearch+esummary?callback=?',
      data: pArg,
      dataType: 'jsonp',
      timeout: 10000,
      success: function(data){
        console.log(data);
        try{
          if (data.entrezajax.error == 'true') {throw 0;}
          dataReturned = data.result.length;
          status = 1;
          for (i=0;i<dataReturned;i++) {
           pData[startCount-1+i] = new dataClass(data.result[i].Id,'Protein',{
              'GI': data.result[i].Gi,
              'Accession': data.result[i].Extra,
              'Title': data.result[i].Title,
              'Organism': data.result[i].Organism,
              'Length': data.result[i].SLen,
              'Comment': data.result[i].Comment
           });
           pData[startCount-1+i].hasSumm = 1;
          }
        } catch (err) {status = 0;}
        console.log(pData);
      },
      error: function(foo,textStatus,errorThrown) {
        if (textStatus == 'timeout') {
          status = -2;
        }
        else {status = 0;}
      },
      complete: function() {
        if (status == 1) {
          for(i=startCount;i<dataReturned;i++){
            for (var x in pData[i].summ) {
             if (pData[i-1].summ[x] == '\/s' || pData[i-1].summ[x] == '') pData[i-1].summ[x] = '-';
            }
          }
        displayTable(type);
        displayNavigator(type);
        }
        else if (status == -2) {
          $('#p_table_container').append('<br/><br/><br/>This is taking longer than usual...Check your connections');
        }
        else if (status == 0) {
          $('#p_table_container').append('<br/><br/><br/>There seems to be some problem with the data received...Check your connections or try again later')
        }
      }
    });
  }
}
//---------------------------------------------------------------------------//
function displayTable(type){
  //eleStart1 = '<div style="display:none"><div class="shiftcontainer"><div class="shadowcontainer"><div class="innerdiv">';
  //eleEnd1 = '</div></div></div>';
  eleStart = '<div><table class="table_ids_cont"><tr><td class="table_ids">';
  eleEnd =  '</td></tr></table></div>';
  if (type == 'g') {
    //console.log(gData);
    startCount = gTable['startCount'];
    retMax = gTable['retMax'];
    totalCount = gTable['totalCount'];
    //console.log('totalCount: ' + totalCount);
    if (totalCount == 0) {
      $('#g_table_container').html('<br/><br/><br/><br/><br/><br/> No data returned.');
      return 0;
    }
    $('#g_table_container').html('');
    for (i=startCount;(i<startCount+retMax)&&(i<=totalCount);i++){
      eleContent = '';
      eleLinks= '';
      eleContent = '<b>Gene Id: </b><br />' + gData[i-1].summ['Gene Id'] + '<br /><br />';
      eleContent += '</td><td class="table_content">';
      eleContent += '<span style = "font-size:14px"><b>' + gData[i-1].summ['Name'] + '</b></span><br />';
      for (var x in gData[i-1].summ) {
        if (x != 'Gene Id' && x != 'Name') {
          if (gData[i-1].summ[x] != '-') {
            eleContent += '<b>' + x + ': </b>' + gData[i-1].summ[x] + '<br />';
          }
        }
      }
      eleLinks = '<a target="_blank" href="http://www.ncbi.nlm.nih.gov/gene/' + gData[i-1].summ['Gene Id'] +'">Full Report</a>';
      //console.log(eleContent);
      var newEle = $(eleStart + eleContent + eleLinks + eleEnd).hide();
      // $('div.sel_table').append(newEle);
      $('#g_table_container').append(newEle);
      newEle.delay(i*100).fadeTo(200,0.4).delay(200).addClass('table_ele');
      //$('div.sel_table > .sel_table_ele:last').fadeTo(1000,0.1).delay(500);
    }
  }
  else if (type == 'p') {
    //$('#p_table_container').html('');//removethe loading symbol
    startCount = pTable['startCount'];
    retMax = pTable['retMax'];
    totalCount = pTable['totalCount'];
    if (totalCount == 0) {
      $('#p_table_container').html('<br/><br/><br/><br/><br/><br/> No data returned.');
      return 0;
    }
    $('#p_table_container').html('');
    for (i=startCount;(i<startCount+retMax)&&(i<=totalCount);i++) {
      acc = pData[i-1].summ['Accession'].split('|');
      //console.log(acc[acc.length-2]);
      //console.log(acc.pop());
      eleContent = '<b>GI: </b><br />' + pData[i-1].summ['GI'] + '<br /><br />';
      eleContent += '<b>Accession: </b><br />' + acc[acc.length-2];
      eleContent += "</td><td class='table_content'>";
      eleContent += "<span style = 'font-size:14px'><b>" + pData[i-1].summ['Title'] + '</b></span><br />';
      eleContent += '<b>Organism: </b>' + pData[i-1].summ['Organism'] + '<br />';
      eleContent += pData[i-1].summ['Length'] + ' aa protein<br />';
      if (pData[i-1].summ['Comment'] != '-') {
       eleContent += '<b>Comment: </b>' + pData[i-1].summ['Comment'] + '<br />';
      }
      eleLinks = '<a target="_blank" href = "http://www.ncbi.nlm.nih.gov/protein/' + pData[i-1].summ['GI'] + '?report=genpept">GenPept</a> | ';
      eleLinks += '<a target="_blank" href = "http://www.ncbi.nlm.nih.gov/protein/' + pData[i-1].summ['GI'] + '?report=fasta">FASTA</a> | ';
      eleLinks += '<a target="_blank" href = "http://www.ncbi.nlm.nih.gov/protein/' + pData[i-1].summ['GI'] + '?report=graphics">Graphics</a>';
      //console.log(eleContent);
      var newEle = $(eleStart + eleContent + eleLinks + eleEnd).hide();
      // $('div.sel_table').append(newEle);
      $('#p_table_container').append(newEle);
      newEle.delay(i*100).fadeTo(200,0.4).delay(200).addClass('table_ele');
      //$('div.sel_table > .sel_table_ele:last').fadeTo(1000,0.1).delay(500);
    }
  }
}
//---------------------------------------------------------------------------//
function displayNavigator(type) {
  nav = '';
  if (type == 'g') {
    startCount = gTable['startCount'];
    retMax = gTable['retMax'];
    totalCount = gTable['totalCount'];
    if (totalCount == 0) {return 0;}
    if (startCount > 1) {
      nav = '<span id ="g_nav_prev"><a href="javascript: void(0)">Prev</a></span>';
    }
    nav += ' | Showing ' + startCount + ' to ' + Math.min((startCount+retMax)-1,totalCount) + ' of ' + totalCount + ' | ';
    if ((startCount+retMax)<totalCount) {
      nav += '<span id ="g_nav_next"><a href="javascript: void(0)">Next</a></span>';
    }
    $('#g_table_navigator').html(nav);
  }
  else if (type =='p') {
    startCount = pTable['startCount'];
    retMax = pTable['retMax'];
    totalCount = pTable['totalCount'];
    if (totalCount == 0) {return 0;}
    if (startCount > 1) {
      nav = '<span id ="p_nav_prev"><a href="javascript: void(0)">Prev</a></span>';
    }
    nav += ' | Showing ' + startCount + ' to ' + Math.min((startCount+retMax)-1,totalCount) + ' of ' + totalCount + ' | ';
    if ((startCount+retMax)<totalCount) {
      nav += '<span id ="p_nav_next"><a href="javascript: void(0)">Next</a></span>';
    }
    $('#p_table_navigator').html(nav);
  }
}
//---------------------------------------------------------------------------//
$('.table_ele').live({
  mouseenter: function(){$(this).stop().fadeTo('fast',1)},
  mouseleave: function(){$(this).stop().fadeTo('slow',0.4)}
});

$('#g_nav_prev').live ({
  click: function() {
    gTable['startCount'] = Math.max(gTable['startCount']-gTable['retMax'],1);
    displayManager('g');
  }
});

$('#g_nav_next').live ({
  click: function() {
    gTable['startCount'] = Math.min(gTable['startCount']+gTable['retMax'],gTable['totalCount']);
    displayManager('g');
  }
});

$('#p_nav_prev').live ({
  click: function() {
    pTable['startCount'] = Math.max(pTable['startCount']-pTable['retMax'],1);
    displayManager('p');
  }
});

$('#p_nav_next').live ({
  click: function() {
    pTable['startCount'] = Math.min(pTable['startCount']+pTable['retMax'],pTable['totalCount']);
    displayManager('p');
  }
});
//---------------------------------------------------------------------------//

//---------------------------------------------------------------------------//

$(window).load(function(){
  //number of fieldsets
  var fieldsetCount = $('#formElem').children().length;
  //current position of fieldset / navigation link
  var current = 1;
  //sum and save the widths of each one of the fieldsets set the 
  //final sum as the total width of the steps element
  var stepsWidth = 0;
  var widths = new Array();
  $('#steps .step').each(function(i){
    var $step = $(this);
    widths[i] = stepsWidth;
    stepsWidth += $step.width();
  });
  $('#steps').width(stepsWidth);
  //to avoid problems in IE, focus the first input of the form
  $('#formElem').children(':first').find(':input:first').focus();
  //show the navigation bar
  $('#navigation').show();
  //when clicking on a navigation link
  //the form slides to the corresponding fieldset
  $('#navigation a').bind('click',function(e){
    var $this = $(this);
    var prev = current;
    $this.closest('ul').find('li').removeClass('selected');
    $this.parent().addClass('selected');
    //we store the position of the link in the current variable
    current = $this.parent().index() + 1;
    /*animate / slide to the next or to the corresponding
    fieldset. The order of the links in the navigation
    is the order of the fieldsets.
    Also, after sliding, we trigger the focus on the first
    input element of the new fieldset
    If we clicked on the last link (confirmation), then we validate
    all the fieldsets, otherwise we validate the previous one
    before the form slided*/
    $('#steps').stop().animate({
      marginLeft: '-' + widths[current-1] + 'px'
    },500,function(){
      if(current == fieldsetCount)
      validateSteps();
      else
      validateStep(prev);
      $('#formElem').children(':nth-child('+ parseInt(current) +')').find(':input:first').focus();
    });
    e.preventDefault();
  });
  //clicking on the tab (on the last input of each fieldset), makes the form
  //slide to the next step
  $('#formElem > fieldset').each(function(){
    var $fieldset = $(this);
    $fieldset.children(':last').find(':input').keydown(function(e){
      if (e.which == 9){
        $('#navigation li:nth-child(' + (parseInt(current)+1) + ') a').click();
        // force the blur for validation
        $(this).blur();
        e.preventDefault();
      }
    });
  });
  //validates errors on all the fieldsets
  //records if the Form has errors in $('#formElem').data()
  function validateSteps(){
    var FormErrors = false;
    for(var i = 1; i < fieldsetCount; ++i){
      var error = validateStep(i);
      if(error == -1) FormErrors = true;
    }
    $('#formElem').data('errors',FormErrors);
  }
  //validates one fieldset
  //and returns -1 if errors found, or 1 if not
  function validateStep(step){
    if(step == fieldsetCount) return;
    var error = 1;
    var hasError = false;
    $('#formElem').children(':nth-child('+ parseInt(step) +')').find(':input:not(button)').each(function(){
      var $this = $(this);
      var valueLength = jQuery.trim($this.val()).length;
      if(valueLength == ''){
        hasError = true;
        this.css('background-color','#FFEDEF');
      }
      else
      $this.css('background-color','#FFFFFF');
    });
    var $link = $('#navigation li:nth-child(' + parseInt(step) + ') a');
    $link.parent().find('.error,.checked').remove();
    var valclass = 'checked';
    if(hasError){
      error = -1;
      valclass = 'error';
    }
    $('<span class="'+valclass+'"></span>').insertAfter($link);
    return error;
  }
  //if there are errors don't allow the user to submit
  $('#registerButton').bind('click',function(){
    if($('#formElem').data('errors')){
      alert('Please correct the errors in the Form');
      return false;
    }
  });
  
  //Load the form once everything is loaded
  $('#loadingDiv').fadeOut("fast");
  $('#content').fadeIn('slow');



 //-----------------------------------------------------------------//
 
 



 /* for(i=0;i<dataRcvd.geneIDs.length;i++) {
    Data.push(new dataClass(dataRcvd.geneIDs[i],"Gene"));
  }
        for(i=0;i<dataRcvd.proteinIDs.length;i++) {
          Data.push(new dataClass(dataRcvd.proteinIDs[i],"Protein"));
        }
      //  alert("total data: " + Data.length);
        SelTableObj.lastDataIndex = Data.length - 1;
        SelTableObj.startIndex["next"] = 0;
        SelTableObj.stopIndex["next"] = $("#sel_table_per_view").val() - 1;
        displayManager();         */
});

//================ Code for Keyboard Navigation ==================//

$(document).ready(function()
{
  	dataRcvd = gadgets.views.getParams();
	console.log(dataRcvd);
	searchTerm = dataRcvd['searchTerm'];
	altCode = dataRcvd['altCode'];
  if (altCode == 1) {
    gArg =  dataRcvd['gArg'];
    pArg = dataRcvd['pArg'];
    console.log(gArg);
    console.log(pArg);
  }
  gTable['totalCount'] = dataRcvd['gCount'];
  pTable['totalCount'] = dataRcvd['pCount'];

 	gadgets.sciverse.getContextInfo(onSelectContextCallback);
displayManager('g');
  displayManager('p');
	$(document).keydown(function(e) {
			if(e.keyCode == 37){
				var prev=$('li.selected').prev();
				if(prev.length > 0){
				  $('li.selected').removeClass('selected');
				  prev.addClass('selected');
				  prev.find('a').click();
				}
				else{
					$('li.selected').removeClass('selected');
					$('#last').addClass('selected');
					$('#last').find('a').click();
				}
			}
			if(e.keyCode == 39){
				var next=$('li.selected').next();
				if(next.length > 0){
					$('li.selected').removeClass('selected');
					next.addClass('selected');
					next.find('a').click();
				}
				else{
					$('li.selected').removeClass('selected');
					$('#first').addClass('selected');
					$('#first').find('a').click();
				}
			}
	});
});