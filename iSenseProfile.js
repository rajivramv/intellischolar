//---------------------------------------------------------------------------//
//---------------------- Start of iSenseProfile.js --------------------------//
//---------------------------------------------------------------------------//

//---------------------------------------------------------------------------//
//----------------------------Global Variables-------------------------------//
//---------------------------------------------------------------------------//
var ArticleOrganisms = [];
var width = 750;
var height = 600;
var xAxis = (screen.availWidth - width) / 2;
var yAxis = (screen.availHeight - height) / 2;
//alert("Position: " +xAxis+" , "+yAxis);
var OrgNum = -1;
var altCode = 0;
var EntrezAJAXapiKey = '4b95cad6da2c14453d35670d15b97e75';
var apiKey = "6319ed9c17f1149e4ad61aad4462427e";
var terms;
var context;
var authToken;
var searchTerm;
var searchUrl;
var sortable = [];
var subscription;
var pii;
var orgFound = false;
var authFound = false;
var refFound = false;
var currentPageAuthorsArray;
var currentAuId = [];
var x;
var params = {};
var requestHeaders = {};
requestHeaders['X-ELS-APIKey'] = apiKey;
requestHeaders['X-ELS-ResourceVersion'] = "XOCS";
requestHeaders['X-ELS-Authtoken'] = "";
requestHeaders['Accept'] = "application/json";
params[gadgets.io.RequestParameters.HEADERS] = requestHeaders;
//---------------------------------------------------------------------------//
//-------------------------------Function List-------------------------------//
//---------------------------------------------------------------------------//
/*
clear
openPopup
window.onload
contextCallback
auidsearchCallback
executeAuthorPubSearch
showTopTen
searchTopAuthorsPubsCallback
allAuIdsearchCallback
resetAll
searchTopAuthorsPubs
searchScopus
searchScopusCallback
showJson
NCBIidsRetrieve
getSpecies
linkText
hoverCallback
hover
$(window).load
*/
//---------------------------------------------------------------------------//
function clear() {
	try {
		console.clear(); //for Firebug/general
	} catch(a) {
		try {
			console._commandLineAPI.clear(); //for Chrome
		} catch(b) {
			try {
				console._inspectorCommandLineAPI.clear(); // forSafari
			} catch(c) {
				console.log(new Array(50).join('\n'));
			}
		}
	}
}
clear();
//---------------------------------------------------------------------------//
function openPopup(content) {
	var popup = window.open("", "", "location=no,menubar=no,toolbar=no,left=200", "");
	popup.document.write("<html><head><title>Contents</title></head>");
	popup.document.write("<body><form><div>");
	//popup.document.write(data.toString());
	popup.document.write(content);
	popup.document.write("</div></form></body></html>");
	//popup.document.close();
}
//---------------------------------------------------------------------------//
function showJson(data) {
	var rs = JSON.stringify(data);
	rs = rs.replace(/",/g, "\",<br>"); //Replace all [",] with [",<br>]
	rs = rs.replace(/\\"/g, "\""); //Replace all [\"] with ["]
	rs = rs.replace(/,"/g, ",<br>\"");
	openPopup(rs);
}
//---------------------------------------------------------------------------//
function contextCallback(data) {
	//showJson(data);
	authToken = data.secureAuthtoken;
	console.log("Auth Token: " + authToken);
	requestHeaders['X-ELS-Authtoken'] = authToken;
	//---------------------------------------------//
	var currentPageAuthors = data.au1Sur_N;
	try {
		subscription = data.entitlement;
		pii = data.pii;
	} catch(err) {}
	currentPageAuthorsArray = $.map(currentPageAuthors.split(","), $.trim);
	//console.log(currentPageAuthorsArray.join("\n"));
	//subscription="UNSUBSCRIBED";
	$("#contentsTable > tbody").children().remove();
	$("#referenceTable > tbody").children().remove();
	if(subscription === "SUBSCRIBED") {
		var auidSearchURL = "http://api.elsevier.com/content/abstract/PII:" + pii + "?view=META&field=authors";
		gadgets.sciverse.makeRequest(auidSearchURL, auidsearchCallback, params);		
	} else {
		$.each(currentPageAuthorsArray, function (index, value) {
			try {
				var currentAuthor = value;
				console.log("User is Not Subscribed to Scopus!");
				$("#contentsTable > tbody").append("<tr class='fixedHeader'><th>" + currentAuthor + "</th></tr>");
				authFound = true;
				$("#contents").slideDown("slow");
			} catch(err) {}
		});
	}
}
//---------------------------------------------------------------------------//
function auidsearchCallback(auiddata) {
	console.log(auiddata);
	var seq;
	currentAuId.length = 0;
	var auidobjtext = auiddata["text"];
	var auidtextJson = gadgets.json.parse(auidobjtext);
	try {
		var author = auidtextJson["abstracts-retrieval-response"]["authors"]["author"];		
	} catch(err) {
		console.log(err);
	}	
	try {
		if($.isArray(author)) {
			$.each(author, function (k, e) {
				if(typeof e !== 'undefined') {
					try {
						seq = parseInt((e["@seq"]), 10);
						currentAuId[seq - 1] = e["@auid"];
					} catch(e) {
						console.log(e)
					}
				}
			});
		} else {
			try {
				seq = parseInt((author["@seq"]), 10);
				currentAuId[seq - 1] = author["@auid"];
			} catch(e) {
				console.log(e)
			}
		}
		currentAuthorsPubsReport();
	} catch(e) {
		console.log(e);
	}
	getAllRefs(pii);
	delete data;
	delete textJson;
	delete author;
}
//---------------------------------------------------------------------------//
function currentAuthorsPubsReport() {
	x = 0;
	$.each(currentAuId, function (index, value) {		
	setTimeout(function () {
		var auPubSearchURL = "http://api.elsevier.com/content/search/index:SCOPUS?query=au-id(" + value + ")&count=200&start=0&field=dc:title,citedby-count,prism:coverDate,prism:doi&sort=-datesort,-numcitedby";		
		gadgets.sciverse.makeRequest(auPubSearchURL, currentAuthorsPubsReportCallback, params);
		}, 5000);
	});
}
//---------------------------------------------------------------------------//
function currentAuthorsPubsReportCallback(data) {
	//showJson(data);
	var objtext = data["text"];
	var textJson = gadgets.json.parse(objtext);
	var entries = textJson["search-results"]["entry"];	
	console.log("\n\n------------------------------------------------------------");
	console.log(currentPageAuthorsArray[x] + ":" + currentAuId[x]);
	console.log("------------------------------------------------------------");
	x++;
	var cCount = 0;
	var maxcCount = 0;
	var pubDate = 00000000;
	var latestPubDate = 00000000;
	var pubTitlebyDate;
	var pubTitlebyCite;
	var latestDOI;
	var mostCitedDOI;
	console.log(entries);
	console.log(entries.length);
	if(typeof entries.length !=='undefined'){
		$.each(entries, function (key, entry) {
			//console.log(typeof entry);
			if(typeof entry !== 'undefined') {
				try {
					var title = entry["dc:title"];				
					try{
					var coverDate = parseInt((entry["prism:coverDate"]).replace(/-/g, ''), 10);
					}catch(e){coverDate = 00000000;}
					try{
					var citedbyCount = parseInt((entry["citedby-count"]), 10);
					}catch(er){citedbyCount = 0;}
					try{
					var doi = entry["prism:doi"];				
					}catch(err){}
					if(typeof doi !== 'undefined') {
						if(coverDate >= latestPubDate) {
							pubTitlebyDate = "";
							latestDOI = ""
							latestPubDate = coverDate;
							pubTitlebyDate = title;
							cCount = citedbyCount;
							latestDOI = doi;
						}
						if(citedbyCount >= maxcCount) {
							pubTitlebyCite = "";
							mostCitedDOI = "";
							maxcCount = citedbyCount;
							pubTitlebyCite = title;
							pubDate = coverDate;
							mostCitedDOI = doi;
						}
					}
				} catch(err) {
					console.log(err);
				}
			}
		});
	}else {
		try{
		  var title = entries["dc:title"];
		  try{
		  var coverDate = parseInt((entries["prism:coverDate"]).replace(/-/g, ''), 10);
		  }catch(e){coverDate = 00000000;}
		  try{
		  var citedbyCount = parseInt((entries["citedby-count"]), 10);
		  }catch(er){citedbyCount = 0;}
		  try{
		  var doi = entries["prism:doi"];				
		  }catch(err){doi="#";}	
		  pubTitlebyDate = "";
		  latestDOI = ""
		  latestPubDate = coverDate;
		  pubTitlebyDate = title;
		  cCount = citedbyCount;
		  latestDOI = doi;
		  pubTitlebyCite = "";
		  mostCitedDOI = "";
		  maxcCount = citedbyCount;
		  pubTitlebyCite = title;
		  pubDate = coverDate;
		  mostCitedDOI = doi;
		}catch(e){}
	}	
	
	
	try {								
		$("#contentsTable > tbody").append("<tr class='fixedHeader'><th><a href=http://www.scopus.com/authid/detail.url?authorId=" + (currentAuId[x - 1]).trim() + " target=&quot;_new&quot;>" + $.trim(currentPageAuthorsArray[x - 1]) + "</a></th></tr>");
		$("#contentsTable > tbody").append("<tr class='normalRow'><td>Latest<br><span class='subscript'>(Dated: " + latestPubDate.toString() + ")</span></td><td><a href=http://dx.doi.org/" + latestDOI + " target=&quot;_new&quot;>" + pubTitlebyDate.trim() + "</a>&nbsp;<span class='subscript'>(Cited By:&nbsp;" + cCount + ")</span></td></tr>");
		$("#contentsTable > tbody").append("<tr class='alternateRow'><td>Most Cited<br><span class='subscript'>(Cited By: " + (maxcCount) + ")</span></td><td><a href=http://dx.doi.org/" + mostCitedDOI + " target=&quot;_new&quot;>" + pubTitlebyCite.trim() + "</a>&nbsp;<span class='subscript'>(Dated:&nbsp;" + pubDate.toString() + ")</span></td></tr>");
	
		console.log("Latest Article: " + pubTitlebyDate + " | Link: http://dx.doi.org/" + latestDOI + " | \nPublished on: " + latestPubDate + " | Cited by: " + cCount);
		console.log("Most Cited Article: " + pubTitlebyCite + " | Link: http://dx.doi.org/" + mostCitedDOI + " | \nPublished on: " + pubDate + " | Cited by: " + maxcCount);
		setTimeout(function () {
				  authFound = true;
				  $("#contents").slideDown("slow");
			  }, 1000);
	} catch(error) {		
		console.log("Error in generating Authors table!");
		console.log(error);
	}	
delete data, objtext, textJson, entries;	
}
//---------------------------------------------------------------------------//
function getAllRefs(pii) {
	var refSearchURL = "http://api.elsevier.com/content/abstract/PII:" + pii + "?view=FULL" //&startref=1&refcount=20";//&field=references&field=dc:title,prism:doi,citedby-count&sort=-numcitedby,-date";
	gadgets.sciverse.makeRequest(refSearchURL, getAllRefsCallback, params);
}
//---------------------------------------------------------------------------//
function getAllRefsCallback(refData) {
	//showJson(data);
	//console.log(refData);
	refFound = false;
	var idArray = [];
	var refIdYrMap = {};
	var refIdTitleMap = {};
	try {
		var objtxt = refData["text"];
		var txtJson = $.parseJSON(objtxt);
		//console.log(objtxt);
		//console.log(txtJson);
	} catch(err) {
		var objtxt = refData["text"];
		console.log("Error found in Data-Structure!");
		console.log("Using RegEx to Retrieve Data!");
		try {
			//console.log(objtxt);
			objtxt = objtxt.replace(/"(\s*,*\s*)"\$"(\s*):(\s*)[^,"\{]/gi, '","$":""}'); //work-around for some deficiency in SciVerse data-structure of this form {"sup":"5""$" :}}} INCOMPLETE/INVALID DATA STRUCTURE
			console.log("RegEx Successfully Worked!");
		} catch(e) {
			console.log("RegEx Not Worked!");
		}
		//console.log(objtxt);
		try {
			var txtJson = $.parseJSON(objtxt);
			//console.log(txtJson);
		} catch(err) {
			console.log("Data could Not be Parsed!");
		}
	}
	try {
		var references = txtJson["abstracts-retrieval-response"]["item"]["bibrecord"]["tail"]["bibliography"]["reference"];
		$.each(references, function (index, value) {
			try {
				var refInfo = value["ref-info"]; //["ref-title"]["ref-titletext"];
				var refTitle = refInfo["ref-title"]["ref-titletext"]
				var refeId = (refInfo["refd-itemidlist"]["itemid"]).$;
				var refYear = refInfo["ref-publicationyear"]["@first"];
				refIdYrMap[refeId] = refYear;
				refIdTitleMap[refeId] = refTitle;
			} catch(err) {}
		});
		try {
			for(var id in refIdYrMap)
			idArray.push([id, refIdYrMap[id]]);
			console.log(idArray);
			console.log(idArray.length);
			if(idArray.length > 2) {
				idArray.sort(function (a, b) {
					return b[1] - a[1]
				});
			}
			$.each(idArray, function (ind, val) {
				try {
					$("#referenceTable > tbody").append("<tr class='normalRefRow'><td><a href=http://www.scopus.com/record/display.url?eid=2-s2.0-" + idArray[ind][0] + "&origin=resultslist target=&quot;_new&quot;>" + (refIdTitleMap[idArray[ind][0]]) + "</a><br><span class='subscript'>(" + (idArray[ind][1]) + ")</span></td></tr>");
					console.log((ind+1) + " | " + idArray[ind][1] + " | " + refIdTitleMap[idArray[ind][0]] + " | Link: http://www.scopus.com/record/display.url?eid=2-s2.0-" + idArray[ind][0] + "&origin=resultslist");
					console.log("------------------------------------------------------------");
					stripedTable();
					refFound = true;
					$("#references").slideDown("slow");
				} catch(e) {
					console.log("val= "+val+" | Error in generating References table!");
				}
			});
		} catch(er) {}
	} catch(error) {
		console.log(error);
		console.log("References Not Found! Searching for Alternate Sources!");
		var refSearchURL = "http://api.elsevier.com/content/article/PII:" + pii + "?view=REF" //&startref=1&refcount=20";//&field=references&field=dc:title,prism:doi,citedby-count&sort=-numcitedby,-date";
		gadgets.sciverse.makeRequest(refSearchURL, altGetAllRefsCallback, params);
	}
	delete idArray;
	delete refIdYrMap;
	delete refIdTitleMap;
	delete refData;
	delete objtxt;
	delete txtJson;
	delete refInfo;
	delete refTitle;
	delete refeId;
	delete refYear;
}
//---------------------------------------------------------------------------//
function altGetAllRefsCallback(altRefData) {
	//console.log(altRefData);
	refFound = false;
	var piiArray = [];
	var refPiiYrMap = {};
	var refPiiTitleMap = {};
	try {
		var objtxt = altRefData["text"];
		var txtJson = $.parseJSON(objtxt);
		//console.log(txtJson);
	} catch(err) {
		console.log("Data could Not be Parsed!");
	}
	try {
		var references = txtJson["full-text-retrieval-response"]["references"]["reference"];
		$.each(references, function (index, value) {
			try {
				var refTitle = value["dc:title"];
				var refPii = value["pii"];
				var refYear = parseInt((value["prism:coverDate"]).split(/[-]+/).shift(), 10);
				//(value["prism:coverDate"]).split('-').trim().shift();
				if(typeof refTitle !== 'undefined' && typeof refPii !== 'undefined' && typeof refYear !== 'undefined' && refTitle != null && refPii != null && refYear != null) {
					console.log(refTitle + " : " + refPii + " : " + refYear);
					refPiiYrMap[refPii] = refYear;
					refPiiTitleMap[refPii] = refTitle;
				}
			} catch(err) {
				console.log(err);
			}
		});
		console.log(refPiiYrMap);
		console.log(refPiiTitleMap);
		try {
			for(var pii in refPiiYrMap)
			piiArray.push([pii, refPiiYrMap[pii]]);
			console.log(piiArray);
			console.log(piiArray.length);
			if(piiArray.length == 0) {
				console.log("Reference Data Not Available in ScienceDirect Database!");
				refFound = false;
			}
			if(piiArray.length > 2) {
				piiArray.sort(function (a, b) {
					return b[1] - a[1]
				});
				console.log("Sorted piiArray:\n" + piiArray);
			}
			$.each(piiArray, function (ind, val) {
				try {
					$("#referenceTable > tbody").append("<tr class='normalRefRow'><td><a href=http://www.sciencedirect.com/science/article/pii/" + piiArray[ind][0] + " target=&quot;_new&quot;>" + (refPiiTitleMap[piiArray[ind][0]]) + "</a><br><span class='subscript'>(" + (piiArray[ind][1]) + ")</span></td></tr>");
					console.log((ind+1) + " | " + piiArray[ind][1] + " | " + refPiiTitleMap[piiArray[ind][0]] + " | Link: http://www.sciencedirect.com/science/article/pii/" + piiArray[ind][0]);
					console.log("------------------------------------------------------------");
					stripedTable();
					refFound = true;
					$("#references").slideDown("slow");
				} catch(e) {
					console.log(e);
					console.log("val= "+val+" | Error in generating References table!");
				}
			});
		} catch(er) {
			console.log(er);
		}
	} catch(error) {
		console.log(error);
	}
	delete piiArray;
	delete refPiiYrMap;
	delete refPiiTitleMap;
	delete altRefData;
	delete objtxt;
	delete txtJson;
	delete refTitle;
	delete refPii;
	delete refYear;
}
//---------------------------------------------------------------------------//
function removeClassName(elem, className) {
	elem.className = elem.className.replace(className, "").trim();
}

function addCSSClass(elem, className) {
	removeClassName(elem, className);
	elem.className = (elem.className + " " + className).trim();
}

function stripedTable() {
	/*	var trs = $("#contentsTable").getElementsByTagName("tr");
		for (var j = 1; j < trs.length; j++) {
			removeClassName(trs[j], 'alternateRow');
			addCSSClass(trs[j], 'normalRow');
		}
		for (var k = 2; k < trs.length; k += 3) {
			removeClassName(trs[k], "normalRow");
			addCSSClass(trs[k], "alternateRow");
		}*/
	var trs = $("#referenceTable").find("tr");
	/*for (var j = 0; j < trs.length; j++) {
			removeClassName(trs[j], "alternateRefRow");
			addCSSClass(trs[j], "normalRefRow");
		}*/
	for(var k = 1; k < trs.length; k += 2) {
		removeClassName(trs[k], "normalRefRow");
		addCSSClass(trs[k], "alternateRefRow");
	}
}
//---------------------------------------------------------------------------//			
function getSpecies() {
          if (altCode != 0){
            altGetSpecies();
            return 0;
         }
	gadgets.sciverse.getArticleContent(function (art) {
                orgId = [];
		orgFound = false;
		var terms = [];
		art = "<div>" + art + "</div>";
		var $suspects = $(art).find('.svArticle em');
		$suspects.each(function (idx, ele) {
			var a = $.trim($(ele).text()).match(/[A-Z][a-z]{2,30}[\s][a-z]{3,30}/);
			if(a && $.inArray(String(a), terms) == '-1') terms.push(String(a));
		}); // end $suspects each
		var $absSuspects = $(art).find('.svAbstract em');
		$absSuspects.each(function (idx, ele) {
			var a = $.trim($(ele).text()).match(/[A-Z][a-z]{2,30}[\s][a-z]{3,30}/);
			if(a && $.inArray(String(a), terms) == '-1') terms.push(String(a));
		}); // end $absSuspects each

		var strTerms = terms.join("[All+Names]+OR+");
	        strTerms = strTerms.replace(/\s/g, "+");
                termsStatus = '';
                $.ajax({
                    type: 'GET',
                    timeout: 10000,
                    url: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=taxonomy&term=' + strTerms,
                    success: function(data){
                      console.log(data);
                      try {
                        if ($(data).find('Count').text() == '0') throw '<em>No terms found</em>';
                        $(data).find('Term').each(function(i,v){
                          ArticleOrganisms.push($(v).text().replace('[All Names]','').toLowerCase());
                          ArticleOrganisms[i] = ArticleOrganisms[i].charAt(0).toUpperCase() + ArticleOrganisms[i].slice(1);
                        });
                        $(data).find('Id').each(function(i,v){
                          orgId.push($(v).text());
                        });
                       } catch(e) {termStatus = e;}
                      OrgNum = ArticleOrganisms.length;
		      console.log(ArticleOrganisms);
 	              if(ArticleOrganisms.length > 0) {
			$('#organismsTable > tbody').children().remove();
			$('#organismsTable > tbody').css('height', '90px');
			$.each(ArticleOrganisms, function (i, v) {
				vVal = $.trim(v).replace(/\s/g, "+")
				console.log(v);
				$('#organismsTable > tbody').append('<tr class="normalRefRow"><td style="width:180px"><a target="_new" href="http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=' + orgId[i] + '">' + v + '</a></td><td style="width:40px;"><input type="checkbox" name="organism" checked="checked" value=' + vVal + '></td></tr>');
			});
			$('#organismsTable').find('tr:odd').removeClass().addClass('alternateRefRow');
			var ht = $('#organismsTable > tbody').css('height');
			if(parseFloat(ht) > 90) $('#organismsTable > tbody').css('height', '90px');
			orgFound = true;
			$('#organisms').slideDown('slow');
                        }
                        termStatus = 'OK';
                    },
                    error: function(){termStatus = '<em>Server down! Try later.</em>'},
                    complete: function(){
                     console.log(termStatus);
                     }
                  });

	}); // end getArticleContent
} // end getSpecies
//---------------------------------------------------------------------------//
function altGetSpecies() {
        gadgets.sciverse.getArticleContent(function (art) {
                orgId = [];
		orgFound = false;
		var terms = [];
		art = "<div>" + art + "</div>";
		var $suspects = $(art).find('.svArticle em');
		$suspects.each(function (idx, ele) {
			var a = $.trim($(ele).text()).match(/[A-Z][a-z]{2,30}[\s][a-z]{3,30}/);
			if(a && $.inArray(String(a), terms) == '-1') terms.push(String(a));
		}); // end $suspects each
		var $absSuspects = $(art).find('.svAbstract em');
		$absSuspects.each(function (idx, ele) {
			var a = $.trim($(ele).text()).match(/[A-Z][a-z]{2,30}[\s][a-z]{3,30}/);
			if(a && $.inArray(String(a), terms) == '-1') terms.push(String(a));
		}); // end $absSuspects each

		var strTerms = terms.join("[All Names] OR ");
	        
	        arg = {
                  'apikey': EntrezAJAXapiKey,
                  'db': 'taxonomy',
                  'term': strTerms,
                };
                termsStatus = '';
                $.ajax({
                    type: 'GET',
                    timeout: 10000,
                    data:arg,
                    url: "http://entrezajax.appspot.com/esearch?callback=?",
                    dataType: 'jsonp',
                    success: function(data){
                      console.log(data);
                      try {
                        if (data.result.Count == '0') throw '<em>No terms found</em>';
                        $(data.result.TranslationStack).each(function(i,v){
                          console.log (typeof v);
                          if (typeof v == "object") {
                            ArticleOrganisms.push(v.Term.replace('[All Names]','').toLowerCase());
                            ArticleOrganisms[i] = ArticleOrganisms[i].charAt(0).toUpperCase() + ArticleOrganisms[i].slice(1);
                          }
                        });
                        orgId = data.result.IdList;
                       } catch(e) {termStatus = e;}
                      OrgNum = ArticleOrganisms.length;
		      console.log(ArticleOrganisms);
 	              if(ArticleOrganisms.length > 0) {
			$('#organismsTable > tbody').children().remove();
			$('#organismsTable > tbody').css('height', '90px');
			$.each(ArticleOrganisms, function (i, v) {
				vVal = $.trim(v).replace(/\s/g, "+")
				console.log(v);
				$('#organismsTable > tbody').append('<tr class="normalRefRow"><td style="width:180px"><a target="_new" href="http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=' + orgId[i] + '">' + v + '</a></td><td style="width:40px;"><input type="checkbox" name="organism" checked="checked" value=' + vVal + '></td></tr>');
			});
			$('#organismsTable').find('tr:odd').removeClass().addClass('alternateRefRow');
			var ht = $('#organismsTable > tbody').css('height');
			if(parseFloat(ht) > 90) $('#organismsTable > tbody').css('height', '90px');
			orgFound = true;
			$('#organisms').slideDown('slow');
                        }
                        termStatus = 'OK';
                    },
                    error: function(){termStatus = '<em>Server down! Try later.</em>'},
                    complete: function(){
                     console.log(termStatus);
                     }
                  });

	}); // end getArticleContent
} // end getSpecies
//---------------------------------------------------------------------------//
function hoverCallback(hoverId) {
	//alert(hoverId);
	resetAll();
	//gadgets.sciverse.getContextInfo(contextCallback);
	/*setTimeout(function(){
				searchTopAuthorsPubs(searchTerm); //Make thess calls from wherever you want, based on performance of your gadget
				searchScopusforAff(searchTerm);
			},10000);*/
}
//---------------------------------------------------------------------------//
function resetAll() {
	delete authorsList;
	delete pubNamesList;
	delete authorsNameArray;
	delete pubNamesArray;
}
//---------------------------------------------------------------------------//
function NCBIidsRetrieve(text, posx, posy) {
	jQuery($('#result').hide().empty());
	if(altCode == 1) {
		altNCBIidsRetrieve(text, posx, posy);
		return 0;
	}
	var gStatus = -1; //status code: -3:timed_out -2:ajax_error -1:initialized  0:data_error 1:success
	var pStatus = -1; //status code: -3:timed_out -2:ajax_error -1:initialized 0:data_error 1:success
	var gXML;
	var pXML;
	dataToPass = {
		'searchTerm': '',
		'altCode': altCode,
		'gCount': '',
		'gWebEnv': '',
		'gQueryKey': '',
		'pCount': '',
		'pWebEnv': '',
		'pQueryKey': ''
	};
	text = $.trim(text); //trimming the ends
	//  console.log(typeof text);
	//console.log(text.length);
	if(text.match(/[^a-zA-Z0-9 ]/g) || text.length == 0) {
		$('#result').html('Not a Gene/Protein!').css({
			'background': '#FFD9D9',
			'border': '1px solid #FF5226',
			'color': '#FF2626'
		}).show().delay(2500).fadeOut(1000).addClass('footer');
		return 0;
	}
	dataToPass['searchTerm'] = text;
	text = text.replace(/\s/g, "+");
	var $organismsEle = $('#organisms').find('input:checked');
	//console.log($organismsEle);
	var selectedOrg = [];
	$organismsEle.each(function (i, ele) {
		selectedOrg.push($(ele).attr('value'));
	});
	//console.log(selectedOrg);
	strOrganisms = selectedOrg.join("[Organism]+OR+");
	strOrganisms = strOrganisms.replace(/\s/g, "+");
	strOrganisms += '[Organism]';
	gURL = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&retmax=0&usehistory=y&term=(" + text + "[Gene+Name])";
	pURL = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=protein&retmax=0&usehistory=y&term=(" + text + "[Protein+Name])";
	if(OrgNum > 0) {
		gURL += "+AND+(" + strOrganisms + ")";
		pURL += "+AND+(" + strOrganisms + ")";
	}
	$.ajax({
		type: 'GET',
		url: gURL,
		timeout: 10000,
		success: function (data) {
			try {
				dataToPass['gCount'] = data.getElementsByTagName('Count')[0].childNodes[0].nodeValue;
				dataToPass['gWebEnv'] = $(data).find('WebEnv').text();
				dataToPass['gQueryKey'] = $(data).find('QueryKey').text();
				if(dataToPass['gCount'] > 0) {
					gStatus = 1;
				} else {
					throw "Ooops...Nothing returned";
				}
			} catch(err) {
				gStatus = 0;
			}
		},
		error: function (foo, textStatus, errorThrown) {
			if(textStatus == 'timeout') {
				gStatus = -3;
			} else {
				gStatus = -2;
				console.log('NCBIidRetrieve for gene: ' + errorThrown);
			}
		},
		complete: function () {
			if((gStatus == -3 || pStatus == -3) && (gStatus != -1 && pStatus != -1)) {
				$('#result').html('Timed out! Reload page.').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show()
			} else if((gStatus == -2 || pStatus == -2) && (gStatus != -1 && pStatus != -1)) {
				$('#result').html('Connection problem! Reload page').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show()
			} else if((gStatus == 1 || pStatus == 1) && (gStatus != -1 && pStatus != -1)) {
				console.log(dataToPass);
				hover(dataToPass, posx, posy);
			} else if((gStatus != -1) && (pStatus != -1)) {
				$('#result').html('Not a Gene/Protein!').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show().delay(2500).fadeOut(1000).addClass('footer');
			}
		}
	});
	$.ajax({
		type: 'GET',
		url: pURL,
		timeout: 10000,
		success: function (data) {
			try {
				dataToPass['pCount'] = data.getElementsByTagName('Count')[0].childNodes[0].nodeValue;
				dataToPass['pWebEnv'] = $(data).find('WebEnv').text();
				dataToPass['pQueryKey'] = $(data).find('QueryKey').text();
				if(dataToPass['pCount'] > 0) {
					pStatus = 1;
				} else {
					throw "Ooops...Nothing returned";
				}
			} catch(err) {
				pStatus = 0;
			}
		},
		error: function (foo, textStatus, errorThrown) {
			if(textStatus == 'timeout') {
				pStatus = -3;
			} else {
				pStatus = -2;
				console.log('NCBIidRetrieve for protein: ' + errorThrown);
			}
		},
		complete: function () {
			if((gStatus == -3 || pStatus == -3) && (gStatus != -1 && pStatus != -1)) {
				$('#result').html('Timed out! Reload page.').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show()
			} else if((gStatus == -2 || pStatus == -2) && (gStatus != -1 && pStatus != -1)) {
				$('#result').html('Unknown error! Reload page').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show()
			} else if((gStatus == 1 || pStatus == 1) && (gStatus != -1 && pStatus != -1)) {
				console.log(dataToPass);
				hover(dataToPass, posx, posy);
			} else if((gStatus != -1) && (pStatus != -1)) {
				$('#result').html('Not a Gene/Protein!').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show().delay(2500).fadeOut(1000).addClass('footer');
			}
		}
	});
}
//---------------------------------------------------------------------------//
function altNCBIidsRetrieve(text, posx, posy) {
	var gStatus = -1; //status code: -3:timed_out -2:ajax_error -1:initialized  0:data_error 1:success
	var pStatus = -1; //status code: -3:timed_out -2:ajax_error -1:initialized 0:data_error 1:success
	var gXML;
	var pXML;
	dataToPass = {
		'altCode': altCode,
		'gCount': '',
		'pCount': '',
		'gArg': [],
		'pArg': []
	};
	text = $.trim(text); //trimming the ends
	if(text.match(/[^a-zA-Z0-9 ]/g) || text.length == 0) {
		$('#result').html('Not a Gene/Protein!').css({
			'background': '#FFD9D9',
			'border': '1px solid #FF5226',
			'color': '#FF2626'
		}).show().delay(2500).fadeOut(1000).addClass('footer');
		return 0;
	}
	dataToPass['searchTerm'] = text;
	// text = text.replace(/\s/g,"+");
	var $organismsEle = $('#organisms').find('input:checked');
	//console.log($organismsEle);
	var selectedOrg = [];
	$organismsEle.each(function (i, ele) {
		selectedOrg.push($(ele).attr('value'));
	});
	//console.log(selectedOrg);
	strOrganisms = selectedOrg.join("[Organism] OR ");
	strOrganisms = strOrganisms.replace(/\+/g, " ");
	strOrganisms += '[Organism]';
	var gTerm = '(' + text + '[Gene Name])';
	var pTerm = '(' + text + '[Protein Name])';
	if(OrgNum > 0) {
		gTerm += "AND(" + strOrganisms + ")";
		pTerm += "AND(" + strOrganisms + ")";
	}
	gArg = {
		'apikey': EntrezAJAXapiKey,
		'db': 'gene',
		'term': gTerm,
		'retmax': 0
	};
	pArg = {
		'apikey': EntrezAJAXapiKey,
		'db': 'protein',
		'term': pTerm,
		'retmax': 0
	};
	console.log('gTerm' + gTerm);
	console.log('pTerm' + pTerm);
	$.ajax({
		type: 'GET',
		url: "http://entrezajax.appspot.com/esearch?callback=?",
		data: gArg,
		dataType: 'jsonp',
		timeout: 10000,
		success: function (data) {
			try {
				console.log('altNCBIidretrieve');
				console.log(data);
				if(data.entrezajax.error == 'true') {
					throw -2;
				}
				dataToPass['gCount'] = data.result.Count;
				dataToPass['gArg'] = gArg;
				if(dataToPass['gCount'] > 0) {
					gStatus = 1;
				} else {
					throw 0;
				}
			} catch(err) {
				gStatus = err;
			}
		},
		error: function (foo, textStatus, errorThrown) {
			if(textStatus == 'timeout') {
				gStatus = -3;
			} else {
				gStatus = -2;
				console.log('NCBIidRetrieve for gene: ' + errorThrown);
			}
		},
		complete: function () {
			if((gStatus == -3 || pStatus == -3) && (gStatus != -1 && pStatus != -1)) {
				$('#result').html('Timed out! Reload page.').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show()
			} else if((gStatus == -2 || pStatus == -2) && (gStatus != -1 && pStatus != -1)) {
				$('#result').html('Unknown error! Reload page').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show()
			} else if((gStatus == 1 || pStatus == 1) && (gStatus != -1 && pStatus != -1)) {
				hover(dataToPass, posx, posy);
			} else if((gStatus != -1) && (pStatus != -1)) {
				$('#result').html('Not a Gene/Protein!').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show().delay(2500).fadeOut(1000).addClass('footer');
			}
		}
	});
	$.ajax({
		type: 'GET',
		url: "http://entrezajax.appspot.com/esearch?callback=?",
		data: pArg,
		dataType: 'jsonp',
		timeout: 10000,
		success: function (data) {
			try {
				console.log('altNCBIidretrieve');
				console.log(data);
				if(data.entrezajax.error == 'true') {
					throw -2;
				}
				dataToPass['pCount'] = data.result.Count;
				dataToPass['pArg'] = pArg;
				if(dataToPass['pCount'] > 0) {
					pStatus = 1;
				} else {
					throw 0;
				}
			} catch(err) {
				pStatus = err;
			}
		},
		error: function (foo, textStatus, errorThrown) {
			if(textStatus == 'timeout') {
				pStatus = -3;
			} else {
				pStatus = -2;
				console.log('NCBIidRetrieve for gene: ' + errorThrown);
			}
		},
		complete: function () {
			if((gStatus == -3 || pStatus == -3) && (gStatus != -1 && pStatus != -1)) {
				$('#result').html('Timed out! Reload page.').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show()
			} else if((gStatus == -2 || pStatus == -2) && (gStatus != -1 && pStatus != -1)) {
				$('#result').html('Unknown error! Reload page').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show()
			} else if((gStatus == 1 || pStatus == 1) && (gStatus != -1 && pStatus != -1)) {
				hover(dataToPass, posx, posy);
			} else if((gStatus != -1) && (pStatus != -1)) {
				$('#result').html('Not a Gene/Protein!').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show().delay(2500).fadeOut(1000).addClass('footer');
			}
		}
	});
}
//---------------------------------------------------------------------------//
//---------------------------------------------------------------------------//
//linkText creates links on all the searchterms, if found
function linkText() {
	// Get the input values from the form
	terms = document.getElementById('nametxt').value.split(',');
	if(!terms || terms[0] == "" || terms[0] == " " || terms[0] === "Gene/Protein Name") {
		//alert("Invalid Search Term!");
		//jQuery($('#result').hide().empty());
		jQuery($('#result').empty().fadeIn().append("Invalid search term."));
		jQuery($('#nametxt').addClass('error'));
	} else {
		jQuery($('#result').hide());
		jQuery($('#nametxt').removeClass('error'));
		var categories = [];
		categories.push("all");
		categories.push("title");
		var frequency = "every";
		var occurrence = 1;
		// Link the text
		gadgets.sciverse.linkText(terms, categories, frequency, occurrence, 'linkTextCallback', NCBIidsRetrieve);
		gadgets.sciverse.getArticleContent(searchArticle)
	}
}
//--------------------------------------------------------------------------//
function searchArticle(articleContent) {
	/*var popup = window.open("","","","");
  	popup.document.write("<html><body>");
  	popup.document.write(articleContent);
  	popup.document.write("</body></html>");	*/
	clear();
	var instances = 0;
	var value;
	//var matchArray=[];
	$('#result').css({
		'background': '#c2f0c2',
		'border': '1px solid #41a62a',
		'-moz-border-radius': '3px',
		'-webkit-border-radius': '3px',
		'color': '#0459b7'
	}).hide().empty();
	$.each(terms, function (index, value) {
		var regex = new RegExp(value.trim(), 'gi');
		//matchArray = articleContent.match(regex);
		//console.log(matchArray); 
		try {
			instances = articleContent.match(regex).length;
			$('#result').append(instances + " instances of <em>" + value.trim() + "<em> found!</br>").addClass('footer').fadeIn(1000);
		} catch(e) {
			$('#result').append("<em>" + value.trim() + "<em> Not Found!<br>").addClass('footer').css({
				'background': '#FFD9D9',
				'border': '1px solid #FF5226',
				'color': '#FF2626'
			}).fadeIn(1000);
		};
	});
}
//--------------------------------------------------------------------------//
function hover(JSONobj, posx, posy) {
	var location = {
		width: width,
		height: height,
		x: xAxis,
		y: yAxis
	};
	gadgets.sciverse.showHoverView(JSONobj, location, hoverCallback);
}
//--------------------------------------------------------------------------//
$(window).load(function () {
	gadgets.sciverse.getContextInfo(contextCallback);	
	setInterval(function () {
		var profileHeight = 170;
		if(orgFound) {profileHeight += 160;}
		if(authFound) {profileHeight += 250;}
		if(refFound) {profileHeight += 250;}		
		gadgets.window.adjustHeight(profileHeight);
	}, 1);
	if($('#nametxt').val() === "Gene/Protein Name") {
		$('#submitbut').fadeOut(10);
		$('#result').hide();
	}
	$('#nametxt').focusin(function () {
		$('#nametxt').css("color", "#0a0");
		$('#nametxt').removeClass('error');
	});
	$('#nametxt').click(function () {
		$('#nametxt').removeClass('error');
		$('#result').hide().empty();
	});
	$('#nametxt').blur(function () {
		$('#nametxt').css("color", "#777");
		if(!$(this).val()) {
			$('#submitbut').fadeOut(10);
		}
	});
	$('#nametxt').mouseleave(function () {
		if(!$(this).val()) {
			$('#submitbut').fadeOut(10);
		}
	});
	//Allow Only Alphanumeric Characters in a TextBox
	$('#nametxt').bind('keypress keyup', function (event) {
		$('#nametxt').removeClass('error');
		$('#result').hide().empty();
		if(this.value.match(/[^a-zA-Z0-9, ]/g)) {
			this.value = this.value.replace(/[^a-zA-Z0-9, ]/g, '');
		}
		if(!$.trim($('#nametxt').val())) {
			$('#submitbut').fadeOut(10);
		}
		var key = String.fromCharCode(event.keyCode);
		if(function () {
			/^[a-zA-Z0-9()]+$/.test(key)
		}) {
			if($.trim($('#nametxt').val) != '' && $.trim($('#nametxt').val())) {
				$('#submitbut').fadeIn('1000');
			}
		}
	});
	$('#submitbut').hover(function () {
		if(!$.trim($('#nametxt').val())) {
			$('#submitbut').fadeOut(10);
		}
	});
	$('#submitbut').focusin(function () {
		if($.trim($('#nametxt').val()) === "Gene/Protein Name") {
			$('#submitbut').fadeOut(10);
		}
	});
	$('#submitbut').click(function () {
		linkText();
	});
	$(document).bind("keydown", function (event) {
		var keycode = (event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode));
		if(keycode == 13 && $("#nametxt").is(":focus")) {
			$("#submitbut").focus().click();
			//alert("Please Click the 'Search' Button!");
			//$("#subpara .submit #submitbut").click(function(){
			//alert("Click Invoked");
			//window.location.reload();
			//location.reload();
			//});
			return false;
		} else {
			return true;
		}
	});
	var loadStatus = 1;
	$.ajax({
		type: 'GET',
		url: 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&retmax=0&term=dummy',
		timeout: 10000,
		success: function () {},
		error: function (foo, textStatus, errorThrown) {
			if(textStatus == 'timeout') {
				$('#result').html('Server down! Try later.').css({
					'background': '#FFD9D9',
					'border': '1px solid #FF5226',
					'color': '#FF2626'
				}).show()
				$('#statusdiv').hide();
				loadStatus = 0;
			} else if(textStatus == 'error') {
				altCode = 1;
			}
		},
		complete: function () {
			if(loadStatus == 1) {
				getSpecies();
				gadgets.sciverse.subscribeHighlightedText('subscribeHighlighted', NCBIidsRetrieve);
				setTimeout(function () {
					jQuery($('#statusdiv').slideDown('slow').remove());
					jQuery($('#searchtool').show());
				}, 1000);
				console.log('altCode=' + altCode);
			}
		}
	});
}); //end of window.load
//---------------------------------------------------------------------------//
//----------------------- End of iSenseProfile.js ---------------------------//
//---------------------------------------------------------------------------//