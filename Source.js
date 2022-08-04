function CLEANDATA() {
  //Import sheets
  var ss = SpreadsheetApp.getActive();
  var timestation = ss.getSheets()[0]
  var ukg = ss.getSheets()[1]

  //get rid of extra UKG info
  ukg.deleteRows(1,8);
  ukg.deleteColumns(1,3);
  ukg.deleteColumn(2);
  ukg.deleteColumns(3,6);

  var ukgData = ukg.getDataRange().getValues();

  //filter out unwanted data from ukg name columns & merge first & last name
  var compiledData = [];
  for (var i = 0; i < ukgData.length; i++) {
    if (ukgData[i][1] != "-" && ukgData[i][1] != "") {
      compiledData.push([ukgData[i].join(" ")])
    }
  }

  //sort and set new data on ukg sheet
  compiledData.sort();
  ukg.deleteColumns(1,2);
  ukg.getRange(1, 1, compiledData.length).setValues(compiledData);

  //get rid of extra timestation info
  timestation.deleteColumn(1);
  timestation.deleteColumns(2, 18);
  timestation.deleteRow(1);

  //get simplified timesheet and UKG data and remove any duplicates
  var tsData = removeDuplicates(timestation.getDataRange().getValues());
  ukgData = removeDuplicates(compiledData);
  console.log(tsData)
  console.log(ukgData)

  //create new variables
  var missingPeople = [];
  //index counter for UKG
  var ukgHop = 0;
  //index counder for timestation
  var tsHop = 0;
  //temp choose variable for discrepencies
  var hopChoose;


  //Comparison Algorithm
  /*
  Start from beginning of 2 sorted lists.
  Continue if both indexes are equal.
  If indexes not equal, sort them. The one at the front of the list is missing from the other.
  Compare lagged index (the one that was not missing) to the next index of the other list.
  Continue this until one of the "hops" overflows its list.
  Dump last indeces as missing from opposite list (the one that overflowed)
  */
  for (var i = 0; i < Math.max(tsData.length, ukgData.length); i++) {
    //check for overflow
    if (ukgHop > ukgData.length) {
      //iterate through remaining
      for (var j = 0; j < tsData.length - ukgHop; j++) {
        missingPeople.push(tsData[j][0] + " is missing from UKG");
      }
      break;
    } else if (tsHop > tsData.length) {
      //iterate through remaining
      for (var j = 0; j < ukgData.length - tsHop; j++) {
        missingPeople.push(ukgData[j][0] + " is missing from Timestation");
      }
      break;
    }
    //if same, continue
    if (ukgData[ukgHop][0] == tsData[tsHop][0]) {
      tsHop++;
      ukgHop++;
    } else {
      //compare indeces
      hopChoose = [ukgData[ukgHop][0], tsData[tsHop][0]].sort();
      //find & push missing indeces, add to one hop
      if (hopChoose[0] == ukgData[ukgHop][0]) {
        missingPeople.push([ukgData[ukgHop][0] + " is missing from Timestation"]);
        ukgHop++;
      } else {
        missingPeople.push([tsData[tsHop][0] + " is missing from UKG"]);
        tsHop++;
      }
    }
  }

  console.log(missingPeople)

  //display missing people
  ukg.getRange(1, 3, missingPeople.length).setValues(missingPeople);
}

//removes duplicates using hash table
function removeDuplicates(a) {
  var seen = {};
  return a.filter(function(item) {
    return seen.hasOwnProperty(item[0]) ? false : (seen[item[0]] = true);
  });
}
