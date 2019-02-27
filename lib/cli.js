/*
 * CLI-related tasks
 *
 */

 // Dependencies
var readline = require('readline');
var util = require('util');
var debug = util.debuglog('cli');
var events = require('events');
class _events extends events{};
var e = new _events();
var os = require('os');
var v8 = require('v8');
var _data = require('./serializer');
var _logs = require('./logs');
var helpers = require('./utils');

// Instantiate the cli module object
var cli = {};

// Input handlers
e.on('man',function(str){
  cli.responders.help();
});

e.on('help',function(str){
  cli.responders.help();
});

e.on('exit',function(str){
  cli.responders.exit();
});

e.on('list menus',function(str){
  cli.responders.listMenus();
});

e.on('list users',function(str){
  cli.responders.listUsers();
});

e.on('more user info',function(str){
  cli.responders.moreUserInfo(str);
});

e.on('list orders',function(str){
  cli.responders.listOrders();
});

e.on('more order info',function(str){
  cli.responders.moreOrderInfo(str);
});

e.on('list logs',function(str){
  cli.responders.listLogs();
});

e.on('more log info',function(str){
  cli.responders.moreLogInfo(str);
});


// Responders object
cli.responders = {};

// Help / Man
cli.responders.help = function(){
  // Codify the commands and their explanations
  var commands = {
    'man' : 'Show this help page',
    'help' : 'Alias of the "man" command',
    'exit' : 'Kill the CLI (and the rest of the application)',  
    'List menus' : 'Show all the menu offered by the pizzeria.',
    'List users' : 'Show a list of all the registered (undeleted) users who have signed up in the last 24 hours',
    'More user info --{email}' : 'Show details of a specified user',
    'List orders' : 'Show a list of orders placed in the last 24 hours',
    'More order info --{orderId}' : 'Show details of a specified order'
  };

  // Show a header for the help page that is as wide as the screen
  cli.horizontalLine();
  cli.centered('CLI MANUAL');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Show each command, followed by its explanation, in white and yellow respectively
  for(var key in commands){
     if(commands.hasOwnProperty(key)){
        var value = commands[key];
        var line = '      \x1b[33m '+key+'      \x1b[0m';
        var padding = 60 - line.length;
        for (i = 0; i < padding; i++) {
            line+=' ';
        }
        line+=value;
        console.log(line);
        cli.verticalSpace();
     }
  }
  cli.verticalSpace(1);

  // End with another horizontal line
  cli.horizontalLine();

};

// Create a vertical space
cli.verticalSpace = function(lines){
  lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
  for (i = 0; i < lines; i++) {
      console.log('');
  }
};

// Create a horizontal line across the screen
cli.horizontalLine = function(){

  // Get the available screen size
  var width = process.stdout.columns;

  // Put in enough dashes to go across the screen
  var line = '';
  for (i = 0; i < width; i++) {
      line+='-';
  }
  console.log(line);


};

// Create centered text on the screen
cli.centered = function(str){
  str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';

  // Get the available screen size
  var width = process.stdout.columns;

  // Calculate the left padding there should be
  var leftPadding = Math.floor((width - str.length) / 2);

  // Put in left padded spaces before the string itself
  var line = '';
  for (i = 0; i < leftPadding; i++) {
      line+=' ';
  }
  line+= str;
  console.log(line);
};

// Exit
cli.responders.exit = function(){
    process.exit(0);
};

// Stats
cli.responders.listMenus = function(){
  _data.read('menus','pizzalist.json',function(err,data){
          if(!err && data){
            cli.horizontalLine();
              cli.centered('LIST OF MENUS');
              cli.horizontalLine();
              cli.verticalSpace(2);
              for(var i=0; i<data.list.length; i++){
                  
                  var value = data.list[i].pizza;
                    var line = '      \x1b[33m '+data.list[i].pizza+'      \x1b[0m';
                    var padding = 60 - line.length;
                    for (var j = 0; j < padding; j++) {
                        line+=' ';
                    }
                    line+='$'+data.list[i].price;
                    console.log(line);
                    cli.verticalSpace();
              }
             
              cli.verticalSpace(1);
          } else {
            console.log('error rendering the menus list:\n'+err);
          }
        });

};

// List Users
cli.responders.listUsers = function(){
  _data.list('users',function(err,userIds){
    if(!err && userIds && userIds.length > 0){
      cli.verticalSpace();
      userIds.forEach(function(userId){
        _data.read('users',userId+'.json',function(err,userData){
          if(!err && userData){
              if(userData.lastconnexion>Date.now()-1000*60*60){
                    var line = 'Name: '+userData.name+' Email: '+userData.email+' Orders: ';
                    var numberOfOrders = typeof(userData.orders) == 'object' && userData.orders instanceof Array && userData.orders.length > 0 ? userData.orders.length : 0;
                    line+=numberOfOrders+' Cart: ';
                    var cart = 0; //typeof(userData.cart) == 'object' && userData.cart instanceof Array && userData.cart.length > 0 ? userData.cart.length+' items' : 'empty';
                    
                    if(userData.cart){
                        if(userData.cart.length > 0){
                            for(var i=0; i<userData.cart.length; i++)
                                cart+=userData.cart[i].quantity;
                        }    
                    }
                  
                    line+=cart;  
                    console.log(line);
                    cli.verticalSpace();   
              }
          }else{
              console.log(err);
          }
        });
      });
    }
  });
};

// More user info
cli.responders.moreUserInfo = function(str){
  // Get ID from string
  var arr = str.split('--');
  var userId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if(userId){
    // Lookup the user
    _data.read('users',userId+'.json',function(err,userData){
      if(!err && userData){
        // Remove the hashed password
        delete userData.hashedPassword;
        // Print their JSON object with text highlighting
        cli.verticalSpace();
        console.dir(userData,{'colors' : true});
        cli.verticalSpace();
          
      }
    });
  }

};

// List Checks
cli.responders.listOrders = function(){
  _data.list('orders',function(err,orderIds){
    if(!err && orderIds && orderIds.length > 0){
      cli.verticalSpace();
      orderIds.forEach(function(orderId){
        _data.read('orders',orderId+'.json',function(err,orderData){
          if(!err && orderData){
              if(orderData.datetime>Date.now()-1000*60*60){
                    var line = 'Id: '+orderData.orderid+' User: '+orderData.email+' Amount: '+orderData.amount+' Items: ';
                    var numberOfItems = 0; //typeof(orderData.items) == 'object' && orderData.items instanceof Array && orderData.items.length > 0 ? orderData.items.length : 0;
                    if(orderData.items){
                        if(orderData.items.length > 0){
                            for(var i=0; i<orderData.items.length; i++)
                                numberOfItems+=orderData.items[i].quantity;
                        }    
                    }
                  
                    line+=numberOfItems;  
                    console.log(line);
                    cli.verticalSpace();  
              }
            
          }else{
              console.log(err);
          }
        });
      });
    }
  });
};

// More check info
cli.responders.moreOrderInfo = function(str){
  // Get ID from string
  var arr = str.split('--');
  var orderId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if(orderId){
    // Lookup the user
    _data.read('orders',orderId+'.json',function(err,orderData){
      if(!err && orderData){
        // Remove the hashed password
        // Print their JSON object with text highlighting
        cli.verticalSpace();
        console.dir(orderData,{'colors' : true});
        cli.verticalSpace();
          
      }
    });
  }

};

// List Logs
cli.responders.listLogs = function(){
  _logs.list(true,function(err,logFileNames){
    if(!err && logFileNames && logFileNames.length > 0){
      cli.verticalSpace();
      logFileNames.forEach(function(logFileName){
        if(logFileName.indexOf('-') > -1){
          console.log(logFileName);
          cli.verticalSpace();
        }
      });
    }
  });
};

// More logs info
cli.responders.moreLogInfo = function(str){
  // Get logFileName from string
  var arr = str.split('--');
  var logFileName = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if(logFileName){
    cli.verticalSpace();
    // Decompress it
    _logs.decompress(logFileName,function(err,strData){
      if(!err && strData){
        // Split it into lines
        var arr = strData.split('\n');
        arr.forEach(function(jsonString){
          var logObject = helpers.parseJsonToObject(jsonString);
          if(logObject && JSON.stringify(logObject) !== '{}'){
            console.dir(logObject,{'colors' : true});
            cli.verticalSpace();
          }
        });
      }
    });
  }
};

// Input processor
cli.processInput = function(str){
  str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;
  // Only process the input if the user actually wrote something, otherwise ignore it
  if(str){
    // Codify the unique strings that identify the different unique questions allowed be the asked
    var uniqueInputs = [
      'man',
      'help',
      'exit',
      'list menus',
      'list orders',
      'more order info',
      'list users',
      'more user info'
    ];

    // Go through the possible inputs, emit event when a match is found
    var matchFound = false;
    var counter = 0;
    uniqueInputs.some(function(input){
      var searchPattern = new RegExp('^' + input,'i');
      if (searchPattern.test(str)) {
        matchFound = true;
        // Emit event matching the unique input, and include the full string given
        e.emit(input,str);
        return true;
      }    
      /*if(str.toLowerCase().indexOf(input) > -1){
        matchFound = true;
        // Emit event matching the unique input, and include the full string given
        e.emit(input,str);
        return true;
      }*/
    });

    // If no match is found, tell the user to try again
    if(matchFound == false){
      console.log("Sorry, try again");
    }

  }
};

// Init script
cli.init = function(){

  // Send to console, in dark blue
  console.log('\x1b[34m%s\x1b[0m','The CLI is running');

  // Start the interface
  var myconsole = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>'
  });

  // Create an initial prompt
  myconsole.prompt();

  // Handle each line of input separately
  myconsole.on('line', function(str){

    // Send to the input processor
    cli.processInput(str);

    // Re-initialize the prompt afterwards
    setTimeout(function(){
        myconsole.prompt();    
    }, 200);  
    
  });

  // If the user stops the CLI, kill the associated process
  myconsole.on('close', function(){
    process.exit(0);
  });

};

 // Export the module
 module.exports = cli;
