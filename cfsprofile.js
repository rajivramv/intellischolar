        var height = 500; 
        var width = 1000;
        var xAxis = 100;  
        var yAxis = 100; 
        var ArticleContent = "";
			
        gadgets.sciverse.subscribeHighlightedText('subscribeHighlighted', callbackHighlight);
      		
		// hoverMe - Opens a hover window with the specified height, width, and location
    
        function hoverMe() {
                // Get the message which will be displayed in the hover window. 
                var message = "Hello World";
                // Get the height, width, and location for the hover window.
                var location = {
                        height:height,
                        width:width,
                        x:xAxis,
                        y:yAxis
                };
                var paramsJson = {msg:message};
                gadgets.sciverse.showHoverView(paramsJson, location, hoverCallback);
        }
	    /**
    	*  hoverCallback - callback method for showHoverView.  Called after a hover window
    	*  is opened.  Passed the 'hoverId' which is a unique identifier for the hover window opened.
    	*  The 'hoverId' can be used to close the individual window.
    	*/

        function hoverCallback(hoverId) {
                gadgets.window.adjustHeight();
        }
	
        function callbackHighlight(term, posx, posy) {
                if (/\s/g.test(term)) {
                        alert("There are whitespaces in the highlighted text");
                        return(0);
                }
            
                alert("IntelliSense will now search for:" + term);
                //Get the message which will be displayed in the hover window. 
                NCBIidURL = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=protein&term=" + term + "+E.Coli+1000&usehistory=y";
                
                if (window.XMLHttpRequest) {
                        // code for IE7+, Firefox, Chrome, Opera, Safari
                        xmlhttp=new XMLHttpRequest();
                }
                else {
                        // code for IE6, IE5
                        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
                }
                
                xmlhttp.open("GET",NCBIidURL,false);
                xmlhttp.send();
                xmlIDs = xmlhttp.responseXML;
                WebEnv = xmlIDs.getElementsByTagName("WebEnv")[0].childNodes[0].nodeValue;
                QueryKey = xmlIDs.getElementsByTagName("QueryKey")[0].childNodes[0].nodeValue;
	
                NCBIsumURL ="http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=protein&WebEnv=" + WebEnv + "&query_key=" + QueryKey;
                xmlhttp.open("GET",NCBIsumURL,false);
                xmlhttp.send();
                xmlSummary = xmlhttp.responseText;
                
                //gadgets.sciverse.getArticleContent(getContentCallback);
        
                //LinnaeusURL = "http://linnaeus.smith.man.ac.uk:8080/axis2/services/linnaeus/tag?text=" + ArticleContent;
                //xmlhttp.open("GET",LinnaeusURL,false);
                //xmlOrganisms = xmlhttp.responseXML;
                //Organisms = xmlOrganisms.getElementsByTagName("ax25:text")[0].childNodes[0].nodeValue;
                
                var message = xmlSummary;    
                var location = {
                        height:height,
                        width:width,
                        x:posx,
                        y:posy
                };
                var paramsJson = {msg:message};
                gadgets.sciverse.showHoverView(paramsJson, location, hoverCallback);
                gadgets.sciverse.getArticleContent(ArticleContentCallback);
                if (ArticleContent!= null) {
                        alert("NOT EMPTY!");
                        //document.write=response;
                }
                else
                {
                        alert ("EMPTY!");
                }
        }
    
        function ArticleContentCallback(response){
                ArticleContent = response;
               /* if (response != null) {
                        alert("NOT EMPTY!");
                        //document.write=response;
                }
                else
                {
                        alert ("EMPTY!");
                }
            return(response);
                // Tells gadget to resize itself
                // gadgets.window.adjustHeight();*/
        } 
  
      
      //Resize the gadget on load
      gadgets.util.registerOnLoadHandler(function() {gadgets.window.adjustHeight();});
      