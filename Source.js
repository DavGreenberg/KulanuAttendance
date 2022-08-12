//finds the people that have hours discrepancies of more than 5 minutes
function COMPARETOTALHOURS() {
  var TIME10MIN = 0.17;
  var ss = SpreadsheetApp.getActive();
  var timestation = ss.getSheets()[0].getDataRange().getValues();
  var ukg = ss.getSheets()[1].getDataRange().getValues();
  
  //get ukg hours with name
  var ukgHours = [];
  for (var i = 8; i < ukg.length - 6; i++) {
    //make sure getting name
    if (!isNaN(ukg[i][3]) || ukg[i][3] == "") {
      continue;
    }
    //check for PTO
    if (ukg[i+1][11] != "") {
      continue;
    }
    if (ukg[i+1][2] == "-") {
      //if forgot to clock out, 0 hours
      ukgHours.push([[ukg[i][3], ukg[i][5]].join(" "), 0]);
    } else {
      //add name & hours to arr
      ukgHours.push([[ukg[i][3], ukg[i][5]].join(" "), parseFloat(ukg[i+1][2])]);
    }
  }

  //get timesheet hours with name
  var tsHours = [];
  for (var i = 1; i < timestation.length; i++) {
    tsHours.push([timestation[i][2], timeToDecimal(timestation[i][4])])
  }

  console.log(ukgHours)
  console.log(tsHours)

  //sort by name
  ukgHours.sort( function(a, b) {
    return a[0].localeCompare(b[0]);
  });
  tsHours.sort( function(a, b) {
    return a[0].localeCompare(b[0]);
  });

  

  //Hours Comparison Algorithm
  /*
  Start from beginning of 2 sorted lists.
  Continue if both names are equal & time difference is <= 5 minutes - if time difference, note in new arr.
  If names not equal, sort them. The one at the front of the list is missing from the other - note with time in new arr.
  Compare lagged index (the one that was not missing) to the next index of the other list.
  Continue this until one of the "hops" overflows its list.
  Dump last indeces as missing from opposite list (the one that overflowed) and include time
  */
  var CURRUKG;
  var CURRTS;
  var TIMEDIFF;
  var ukgHop = 0;
  var tsHop = 0
  var hoursDiscrepancies = []
  for (var i = 0; i < Math.max(tsHours.length, ukgHours.length); i++) {
    CURRUKG = ukgHours[ukgHop];
    CURRTS = tsHours[tsHop];
    //check for overflow
    if (ukgHop > ukgHours.length) {
      //iterate through remaining
      for (var j = 0; j < tsHours.length - ukgHop; j++) {
        hoursDiscrepancies.push([tsHours[j][0] + " is missing from UKG. TimeStation Hours - " + CURRTS[1]]);
      }
      break;
    } else if (tsHop > tsHours.length) {
      //iterate through remaining
      for (var j = 0; j < ukgHours.length - tsHop; j++) {
        hoursDiscrepancies.push([ukgHours[j][0] + " is missing from Timestation. UKG Hours - " + CURRUKG[1]]);
      }
      break;
    }
    //if same, continue & compare times
    if (CURRUKG[0] == CURRTS[0]) {
      TIMEDIFF = Math.abs(CURRUKG[1] - CURRTS[1])
      if (TIMEDIFF > TIME10MIN) {
        hoursDiscrepancies.push([CURRUKG[0] + " has time discrepancy: UKG - " + CURRUKG[1] + " TimeStation - " + CURRTS[1] + " (" + TIMEDIFF + ")"])
      }
      tsHop++;
      ukgHop++;
    } else {
      //compare indeces
      hopChoose = [CURRUKG[0], CURRTS[0]].sort();
      //find & push missing indeces, add to one hop
      if (hopChoose[0] == CURRUKG[0]) {
        hoursDiscrepancies.push([CURRUKG[0] + " is missing from Timestation. UKG Hours - " + CURRUKG[1]]);
        ukgHop++;
      } else {
        hoursDiscrepancies.push([CURRTS[0] + " is missing from UKG. TimeStation Hours - " + CURRTS[1]]);
        tsHop++;
      }
    }
  }

  console.log(hoursDiscrepancies);
  
  //create new sheet and add found discrepancies
  ss.insertSheet("Found Discrepancies");
  var foundSheet = ss.getSheetByName("Found Discrepancies");
  foundSheet.getRange(1, 1, hoursDiscrepancies.length).setValues(hoursDiscrepancies);
}

//converts HH:MM to decimal
function timeToDecimal(t) {
  t = t.split(':');
  return parseInt(t[0]) + parseFloat((parseInt(t[1])/60).toFixed(2));
}  

//removes duplicates using hash table
function removeDuplicates(a) {
  var seen = {};
  return a.filter(function(item) {
    return seen.hasOwnProperty(item[0]) ? false : (seen[item[0]] = true);
  });
}
