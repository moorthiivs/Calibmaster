/*************************************************************************************************************/
// Name        : formula_parser.js
// Version     : 2.8
// Description : This javascript file contains parser functions for generating code based on math.js library
// Author      : Renukumar P
// Version   Author            Date         Description
// 2.0       Renukumar P      24-07-2024   added logic for POWER, SQRT
// 2.1       Renukumar P      24-07-2024   added %, STDEV
// 2.2       Renukumar P      10-08-2024   added MIN, MAX, LEFT,ABS
// 2.3       Praveen E        19-08-2024   removed the preffix the 0 in STDEV
// 2.4       Praveen E        31-08-2024   added logic for IF
// 2.5       Renukumar P      10-09-2024   added trimIfString function
// 2.6       Renukumar P      15-09-2024   i.set precendence for SQRT, POWER,ABS,STDEV, to 3 to process without parenthesis
//                                           now simply mentioning as SQRT(3) will work , instead of (SQRT(3))
//                                         ii. added logic to remove the +0 that was getting added to the SUM
//2.7        Praveen E        17-09-2024   updated tokenize function to handle special characters like 
//2.8        Praveen E        28-10-2024   added LEFT, RIGHT, SUMSQ, =, <, >, !=, <=, >=
/**************************************************************************************************************/


//TODO: Include the new operators in the tokenize function
function tokenize(formula) {
    const tokens = [];
    let currentToken = '';

    // Define the operators and special characters
    const operators = /[:,^+\-*/%()<>!=]/;

    for (let i = 0; i < formula.length; i++) {
        const char1 = formula[i];

        if (char1 !== undefined) {
            if (/[0-9 A-Za-z.]/.test(char1)) {
                // Numbers, spaces, letters, and decimal points are part of a token
                currentToken += char1;
            } else if (operators.test(char1)) {
                // Check for multi-character operators
                if (currentToken) {
                    tokens.push(currentToken);
                    currentToken = '';
                }

                // Check if the next character forms a multi-character operator
                const nextChar = formula[i + 1];
                if (char1 === '>' || char1 === '<' || char1 === '!' || char1 === '=') {
                    if (nextChar === '=' || (char1 === '!' && nextChar === '=')) {
                        tokens.push(char1 + nextChar);
                        i++; // Skip the next character as it's part of the current token
                    } else {
                        tokens.push(char1);
                    }
                } else {
                    tokens.push(char1);
                }
            }
            else {
                tokens.push(char1);
            }
            // Ignore other characters (whitespace, etc.)
        }
    }
    // Push any remaining token (if any)
    if (currentToken) {
        tokens.push(currentToken);
    }
    //console.log(tokens);

    return tokens;
}

//TODO: Include the new operators in the shuntingYard function
function shuntingYard(tokens) {
    const outputQueue = []; // Output in RPN format
    const operatorStack = []; // Stack for operators

    //precedence 1 means lowest, 2 means next highest and so on.
    const precedence = {    // TODO: Step 2 add the new binary operators and Add functions here
        '+': 1,
        '-': 1,
        '*': 1,
        '/': 1,
        ':': 1,
        '^': 2,
        '>': 2,
        '<': 2,
        '=': 2,
        '==': 2,
        '>=': 2,
        '<=': 2,
        '!=': 2,
        '%': 2,
        'SUM': 2,
        'SUMSQ': 2,
        'SQRT': 3,
        'AVERAGE': 1,
        'STDEV': 3,
        'POWER': 3,
        'HEADER': 1,
        'TEXT': 1,
        'NOTE': 1,
        'VALUEOF': 1,
        'DEFAULTVALUE': 1,
        'ROUND': 3,
        'MAX': 1,
        'MIN': 1,
        'LEFT': 1,
        'ABS': 3,
        'RIGHT': 1,
        ',': 1,
        'IF': 2

        // Add more operators and their precedence if needed
    };

    for (const token of tokens) {
        switch (token) {
            //case 'POWER':
            //operatorStack.push(token);
            //break;
            case '(':
                // If it's an opening parenthesis, push it to the stack
                operatorStack.push(token);
                break;
            case ')':
                // If it's a closing parenthesis
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                    // Pop operators until an opening parenthesis is encountered
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.pop(); // Discard the opening parenthesis 
                break;
            // Add more operators if needed
            default:
                if (token in precedence) {
                    // If it's an operator
                    while (
                        operatorStack.length > 0 &&
                        precedence[token] <= precedence[operatorStack[operatorStack.length - 1]]
                    ) {
                        // Pop operators from the stack and add them to the output queue
                        outputQueue.push(operatorStack.pop());
                    }
                    operatorStack.push(token); // Push the current operator to the stack
                } else {
                    outputQueue.push(token);

                }
        }
    }

    // Pop any remaining operators from the stack and add them to the output queue
    while (operatorStack.length > 0) {
        outputQueue.push(operatorStack.pop());
    }

    return outputQueue;
}

//TODO: Focus on this. the logic for generating the code has to be written here for every operator
function evaluateRPN(inputCellid, rpnTokens) {
    const evalStack = [];


    let operand2 = "#";
    let operand1 = "#";
    let evaluatedResult = "#";
    let outputresult = "#";
    let final_formula_tmp1 = "xx";
    let final_formula_tmp2 = "xx";
    let outputresultJSON = "xx";

    for (const token of rpnTokens) {

        //Process the operator token and generate the <script> statements
        //TODO: Step 3 add the code that needes to be generated for the token

        switch (token) {
            case ' ':
                // Handle space character ' '
                break;

            case '+':
                operand2 = evalStack.pop().trim();

                if (isNaN(parseFloat(operand2))) {
                    // If it's a number, push it to the stack
                    operand2 = operand2;
                }

                operand1 = evalStack.pop().trim();

                if (isNaN(parseFloat(operand1))) {
                    // If it's a number, push it to the stack
                    operand1 = operand1;
                }

                evaluatedResult = "(" + operand1 + '+' + operand2 + ")";
                evalStack.push(evaluatedResult);
                break;

            //-- MINUS operator start  
            case '-':

                //If a neagative number comes as RPN token the evalStack size will be 1 ex. for -30.0 the RPN token will be [30.0, -]
                //for minus operator, the evalStack size will be 2
                if (evalStack.length == 1) {

                    evaluatedResult = token;

                } else {

                    operand2 = evalStack.pop().trim();

                    if (isNaN(parseFloat(operand2))) {
                        // If it's a number, push it to the stack
                        operand2 = operand2;
                    }

                    operand1 = evalStack.pop().trim();

                    if (isNaN(parseFloat(operand1))) {
                        // If it's a number, push it to the stack
                        operand1 = operand1;
                    }

                    //the formula is properly received and converted a mathJS valid expression or formula
                    evaluatedResult = "(" + operand1 + '-' + operand2 + ")";

                }

                evalStack.push(evaluatedResult);
                break;
            //-- MINUS end 

            case '*':
                operand2 = evalStack.pop().trim();

                if (isNaN(parseFloat(operand2))) {
                    // If it's a number, push it to the stack
                    operand2 = operand2;
                }

                operand1 = evalStack.pop().trim();

                if (isNaN(parseFloat(operand1))) {
                    // If it's a number, push it to the stack
                    operand1 = operand1;
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + operand1 + '*' + operand2 + ")";
                evalStack.push(evaluatedResult);
                break;

            case '/':
                operand2 = evalStack.pop();

                if (isNaN(parseFloat(operand2))) {
                    // If it's a number, push it to the stack
                    operand2 = operand2;
                }

                operand1 = evalStack.pop();

                if (isNaN(parseFloat(operand1))) {
                    // If it's a number, push it to the stack
                    operand1 = operand1;
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + operand1 + '/' + operand2 + ")";
                evalStack.push(evaluatedResult);
                break;

            case '>':
                operand2 = evalStack.pop();

                if (isNaN(parseFloat(operand2))) {
                    // If it's a number, push it to the stack
                    operand2 = operand2;
                }

                operand1 = evalStack.pop();

                if (isNaN(parseFloat(operand1))) {
                    // If it's a number, push it to the stack
                    operand1 = operand1;
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + operand1 + '>' + operand2 + ")";
                evalStack.push(evaluatedResult);
                break;

            case '<':
                operand2 = evalStack.pop();

                if (isNaN(parseFloat(operand2))) {
                    // If it's a number, push it to the stack
                    operand2 = operand2;
                }

                operand1 = evalStack.pop();

                if (isNaN(parseFloat(operand1))) {
                    // If it's a number, push it to the stack
                    operand1 = operand1;
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + operand1 + '<' + operand2 + ")";
                evalStack.push(evaluatedResult);
                break;

            case '=':
                operand2 = evalStack.pop();

                if (isNaN(parseFloat(operand2))) {
                    // If it's a number, push it to the stack
                    operand2 = operand2;
                }

                operand1 = evalStack.pop();

                if (isNaN(parseFloat(operand1))) {
                    // If it's a number, push it to the stack
                    operand1 = operand1;
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + operand1 + '==' + operand2 + ")";
                evalStack.push(evaluatedResult);
                break;

            case '<=':
                operand2 = evalStack.pop();

                if (isNaN(parseFloat(operand2))) {
                    // If it's a number, push it to the stack
                    operand2 = operand2;
                }

                operand1 = evalStack.pop();

                if (isNaN(parseFloat(operand1))) {
                    // If it's a number, push it to the stack
                    operand1 = operand1;
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + operand1 + '<=' + operand2 + ")";
                evalStack.push(evaluatedResult);
                break;

            case '>=':
                operand2 = evalStack.pop();

                if (isNaN(parseFloat(operand2))) {
                    // If it's a number, push it to the stack
                    operand2 = operand2;
                }

                operand1 = evalStack.pop();

                if (isNaN(parseFloat(operand1))) {
                    // If it's a number, push it to the stack
                    operand1 = operand1;
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + operand1 + '>=' + operand2 + ")";
                evalStack.push(evaluatedResult);
                break;

            case '!=':
                operand2 = evalStack.pop();

                if (isNaN(parseFloat(operand2))) {
                    // If it's a number, push it to the stack
                    operand2 = operand2;
                }

                operand1 = evalStack.pop();

                if (isNaN(parseFloat(operand1))) {
                    // If it's a number, push it to the stack
                    operand1 = operand1;
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + operand1 + '!=' + operand2 + ")";
                evalStack.push(evaluatedResult);
                break;

            case '==':
                operand2 = evalStack.pop();

                if (isNaN(parseFloat(operand2))) {
                    // If it's a number, push it to the stack
                    operand2 = operand2;
                }

                operand1 = evalStack.pop();

                if (isNaN(parseFloat(operand1))) {
                    // If it's a number, push it to the stack
                    operand1 = operand1;
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + operand1 + '==' + operand2 + ")";
                evalStack.push(evaluatedResult);
                break;

            case '^':
                operand2 = evalStack.pop().trim();

                if (isNaN(parseFloat(operand2))) {
                    // If it's a number, push it to the stack
                    operand2 = operand2;
                }

                operand1 = evalStack.pop().trim();

                if (isNaN(parseFloat(operand1))) {
                    // If it's a number, push it to the stack
                    operand1 = operand1;
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + operand1 + '^' + operand2 + ")";
                evalStack.push(evaluatedResult);
                break;

            case '%':

                operand1 = evalStack.pop()?.trim();

                if (isNaN(parseFloat(operand1))) {
                    // If it's a number, push it to the stack
                    operand1 = operand1;
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                //operand divided by 100 for percentage operand% ex 5% is 0.05 , 0.2% is 0.002
                evaluatedResult = "(" + operand1 + '/100' + ")";
                evalStack.push(evaluatedResult);
                break;

            case 'HEADER':

                operand1 = evalStack.pop();

                evaluatedResult = operand1;

                outputresultJSON = '{"HEADER" : "' + operand1 + '"}';

                outputresult = JSON.parse(outputresultJSON);

                evalStack.push(outputresult);
                break;

            case 'TEXT':

                operand1 = evalStack.pop();

                evaluatedResult = operand1;

                outputresultJSON = '{"TEXT" : "' + operand1 + '"}';

                outputresult = JSON.parse(outputresultJSON);

                evalStack.push(outputresult);
                break;

            case 'NOTE':

                operand1 = evalStack.pop();
                evaluatedResult = operand1;

                outputresultJSON = '{"NOTE" : "' + operand1 + '"}';
                outputresult = JSON.parse(outputresultJSON);

                evalStack.push(outputresult);
                break;

            case 'INPUT':

                operand1 = evalStack.pop();

                outputresultJSON = '{"INPUT" : ""}';

                outputresult = JSON.parse(outputresultJSON);

                evalStack.push(outputresult);
                break;

            //-- DEFAULTVALUE start  
            case 'DEFAULTVALUE':

                if (evalStack.length == 1) {
                    operand1 = evalStack.pop();
                    evaluatedResult = operand1;
                    outputresultJSON = '{"DEFAULTVALUE" : "' + operand1 + '"}';
                } else {
                    operand1 = evalStack.pop();
                    operand2 = evalStack.pop();
                    evaluatedResult = operand1 + operand2;
                    outputresultJSON = '{"DEFAULTVALUE" : "' + evaluatedResult + '"}';

                }

                outputresult = JSON.parse(outputresultJSON);

                evalStack.push(outputresult);
                break;
            //-- DEFAULTVALUE end

            case 'VALUEOF':

                operand1 = evalStack.pop().trim();
                operand1 = operand1;

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = operand1;

                outputresultJSON = '{"VALUEOF" : "' + evaluatedResult + '"}';

                outputresult = JSON.parse(outputresultJSON);

                evalStack.push(outputresult);
                break;
            case 'BLANK':

                operand1 = evalStack.pop();

                evaluatedResult = operand1;

                outputresultJSON = '{"BLANK" : ""}';

                outputresult = JSON.parse(outputresultJSON);

                evalStack.push(outputresult);
                break;

            //-- SUM start  
            case 'SUM':

                //the example token for SUM operator is ['T1C2', 'T1C3', ':', 'SUM']
                //'T1C2', 'T1C3', ':' will be in the stack, so first popout the : then operate on the ending and starting sum operators
                const colon_operand_sum = evalStack.pop().trim();

                operand2 = evalStack.pop().trim();
                operand1 = evalStack.pop().trim();

                let to_cellId_sum = splitIdString(operand2);
                let from_cellId_sum = splitIdString(operand1);

                evaluatedResult = "";

                for (let from_cellid_charcode = from_cellId_sum.cellId_Char_Part_charCode; from_cellid_charcode <= to_cellId_sum.cellId_Char_Part_charCode; from_cellid_charcode++) {
                    for (let from_cellid_num = from_cellId_sum.cellId_Number_Part; from_cellid_num <= to_cellId_sum.cellId_Number_Part; from_cellid_num++) {

                        evaluatedResult = evaluatedResult + from_cellId_sum.tablePart + String.fromCharCode(from_cellid_charcode) + from_cellid_num + "+";

                    }
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + evaluatedResult.slice(0, -1) + ")";

                evalStack.push(evaluatedResult);
                break;
            //-- SUM end

            //-- SUM start  
            case 'SUMSQ':
                //the example token for SUM operator is ['T1C2', 'T1C3', ':', 'SUMSQ']
                //'T1C2', 'T1C3', ':' will be in the stack, so first popout the : then operate on the ending and starting SUMSQ operators
                const colon_operand_sumsq = evalStack.pop().trim();

                operand2 = evalStack.pop().trim();
                operand1 = evalStack.pop().trim();

                let to_cellId_sumsq = splitIdString(operand2);
                let from_cellId_sumsq = splitIdString(operand1);

                evaluatedResult = "";
                let sqrt = 1;
                for (let from_cellid_charcode = from_cellId_sumsq.cellId_Char_Part_charCode; from_cellid_charcode <= to_cellId_sumsq.cellId_Char_Part_charCode; from_cellid_charcode++) {
                    for (let from_cellid_num = from_cellId_sumsq.cellId_Number_Part; from_cellid_num <= to_cellId_sumsq.cellId_Number_Part; from_cellid_num++) {

                        evaluatedResult = evaluatedResult + from_cellId_sumsq.tablePart + String.fromCharCode(from_cellid_charcode) + from_cellid_num + "^" + sqrt + "+";
                        sqrt++;

                    }
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + evaluatedResult.slice(0, -1) + ")";

                evalStack.push(evaluatedResult);
                break;
            //-- SUM end

            case 'AVERAGE':

                //the example token for AVG operator is ['T1C2', 'T1C3', ':', 'AVG']
                //'T1C2', 'T1C3', ':' will be in the stack, so first popout the : then operate on the ending and starting sum operators
                const colon_operand2 = evalStack.pop().trim();

                operand2 = evalStack.pop().trim();
                operand1 = evalStack.pop().trim();

                let to_cellId_avg = splitIdString(operand2);
                let from_cellId_avg = splitIdString(operand1);
                let number_of_elements = 0;

                evaluatedResult = "";

                for (let from_cellid_charcode = from_cellId_avg.cellId_Char_Part_charCode; from_cellid_charcode <= to_cellId_avg.cellId_Char_Part_charCode; from_cellid_charcode++) {
                    for (let from_cellid_num = from_cellId_avg.cellId_Number_Part; from_cellid_num <= to_cellId_avg.cellId_Number_Part; from_cellid_num++) {

                        evaluatedResult = evaluatedResult + from_cellId_avg.tablePart + String.fromCharCode(from_cellid_charcode) + from_cellid_num + "+";

                        number_of_elements++;

                    }
                }

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "(" + "(" + evaluatedResult.slice(0, -1) + ")/" + number_of_elements + ")";

                evalStack.push(evaluatedResult);
                break;

            case 'STDEV':

                //the example token for SUM operator is ['T1C2', 'T1C3', ':', 'SUM']
                //'T1C2', 'T1C3', ':' will be in the stack, so first popout the : then operate on the ending and starting sum operators
                const colon_operand_stdev = evalStack.pop().trim();

                operand2 = evalStack.pop().trim();
                operand1 = evalStack.pop().trim();

                let to_cellId_stdev = splitIdString(operand2);
                let from_cellId_stdev = splitIdString(operand1);

                evaluatedResult = "";

                for (let from_cellid_charcode = from_cellId_stdev.cellId_Char_Part_charCode; from_cellid_charcode <= to_cellId_stdev.cellId_Char_Part_charCode; from_cellid_charcode++) {
                    for (let from_cellid_num = from_cellId_stdev.cellId_Number_Part; from_cellid_num <= to_cellId_stdev.cellId_Number_Part; from_cellid_num++) {

                        evaluatedResult = evaluatedResult + from_cellId_stdev.tablePart + String.fromCharCode(from_cellid_charcode) + from_cellid_num + ",";

                    }
                }

                evaluatedResult = evaluatedResult.slice(0, evaluatedResult.length - 1)

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "std(" + evaluatedResult + ")";

                evalStack.push(evaluatedResult);
                break;
            //-- STDDEV end

            //-- MAX start  
            case 'MAX':

                //the example token for SUM operator is ['T1C2', 'T1C3', ':', 'MAX']
                //'T1C2', 'T1C3', ':' will be in the stack, so first popout the : then operate on the ending and starting max operators
                const colon_operand_max = evalStack.pop().trim();

                operand2 = evalStack.pop().trim();
                operand1 = evalStack.pop().trim();

                let to_cellId_max = splitIdString(operand2);
                let from_cellId_max = splitIdString(operand1);

                evaluatedResult = "";

                for (let from_cellid_charcode = from_cellId_max.cellId_Char_Part_charCode; from_cellid_charcode <= to_cellId_max.cellId_Char_Part_charCode; from_cellid_charcode++) {
                    for (let from_cellid_num = from_cellId_max.cellId_Number_Part; from_cellid_num <= to_cellId_max.cellId_Number_Part; from_cellid_num++) {
                        evaluatedResult = evaluatedResult + from_cellId_max.tablePart + String.fromCharCode(from_cellid_charcode) + from_cellid_num + ",";
                    }
                }

                //Remove the last comma
                evaluatedResult = evaluatedResult.substr(0, (evaluatedResult.length) - 1);

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "max(" + evaluatedResult + ")";

                evalStack.push(evaluatedResult);
                break;
            //-- MAX end        

            //-- MIN start  
            case 'MIN':

                //the example token for SUM operator is ['T1C2', 'T1C3', ':', 'MAX']
                //'T1C2', 'T1C3', ':' will be in the stack, so first popout the : then operate on the ending and starting max operators
                const colon_operand_min = evalStack.pop().trim();

                operand2 = evalStack.pop().trim();
                operand1 = evalStack.pop().trim();

                let to_cellId_min = splitIdString(operand2);
                let from_cellId_min = splitIdString(operand1);

                evaluatedResult = "";

                for (let from_cellid_charcode = from_cellId_min.cellId_Char_Part_charCode; from_cellid_charcode <= to_cellId_min.cellId_Char_Part_charCode; from_cellid_charcode++) {
                    for (let from_cellid_num = from_cellId_min.cellId_Number_Part; from_cellid_num <= to_cellId_min.cellId_Number_Part; from_cellid_num++) {

                        evaluatedResult = evaluatedResult + from_cellId_min.tablePart + String.fromCharCode(from_cellid_charcode) + from_cellid_num + ",";

                    }
                }

                //Remove the last comma
                evaluatedResult = evaluatedResult.substr(0, (evaluatedResult.length) - 1);

                //the formula is properly received and converted a mathJS valid expression or formula
                evaluatedResult = "min(" + evaluatedResult + ")";

                evalStack.push(evaluatedResult);
                break;
            //-- MIN end         



            //-- ROUND start 
            case 'ROUND':

                //the example token for ROUND operator is ['T1C2', 'T1C3', ':', 'ROUND']
                //'T1C2', 'T1C3', ':' will be in the stack, so first popout the : then operate on the ending and starting sum operators
                const comma_operand = evalStack.pop().trim();

                operand2 = evalStack.pop().trim();
                operand1 = evalStack.pop().trim();

                evaluatedResult = "(round(" + operand1 + "," + operand2 + "))";

                evalStack.push(evaluatedResult);
                break;
            //-- ROUND end 

            //-- IF start 
            case 'IF':
                //the example token for IF operator is [(T1C2>T1C3), '1', ',', '0', ',']
                //(T1C2>T1C3), '1', ',', '0', ',' will be in the stack, so first popout the ,

                const comma_operand_if = evalStack.pop().trim(); // ','

                let operand3 = evalStack.pop().trim(); // 0

                if (operand3 == "'") { // [(T1C2>T1C3), ''', '1', ''', ',', ''', '0', ''', ',']
                    operand3 = evalStack.pop().trim();
                    evalStack.pop().trim();
                }

                operand3 = operand3.includes('NULL') ? ' ' : operand3;

                let isQuotes = evalStack.pop().trim();
                if (isQuotes == '"' || isQuotes == "'") {
                    evalStack.pop().trim();
                    evalStack.pop().trim();
                }

                operand2 = evalStack.pop().trim(); // 1
                if (operand2 == "'" || operand2 == '"') {
                    operand2 = evalStack.pop().trim();
                    evalStack.pop().trim();
                }

                operand1 = evalStack.pop().trim(); // (T1C2>T1C3)

                if (operand1 == '"' || operand1 == "'") {
                    evalStack.pop().trim();
                    operand1 = evalStack.pop().trim();
                }

                evaluatedResult = "(" + operand1 + "?" + operand2 + ":" + operand3 + ")";
                evalStack.push(evaluatedResult);
                break;
            //-- IF end 

            //-- SQRT start       
            case 'SQRT':

                //['2', 'SQRT'] will be in the stack, so first popout the value then remove the SQRT operator
                //evaluateRPN Received rpnTokens.. ['2', 'SQRT']
                operand1 = evalStack.pop().trim();

                evaluatedResult = "(sqrt(" + operand1 + "))";

                evalStack.push(evaluatedResult);
                break;
            //-- SQRT end 

            //-- ABS start       
            case 'ABS':

                //['2', 'ABS'] will be in the stack, so first popout the value then remove the ABS operator
                //evaluateRPN Received rpnTokens.. ['2', 'ABS']
                operand1 = evalStack.pop().trim();

                evaluatedResult = "(abs(" + operand1 + "))";

                evalStack.push(evaluatedResult);
                break;
            //-- ABS end       

            //-- POWER start        
            case 'POWER':

                //the example token for SUM operator is ['T1C2', 'T1C3', ',', 'POWER']
                //'T1C2', 'T1C3', ',' will be in the stack, so first popout the , then operate on the ending and starting POWER operators
                const comma_operand_power = evalStack.pop().trim();

                operand2 = evalStack.pop().trim();
                operand1 = evalStack.pop().trim();

                evaluatedResult = "(pow(" + operand1 + "," + operand2 + "))";

                evalStack.push(evaluatedResult);
                break;
            //-- POWER end 

            //-- LEFT start        
            case 'LEFT':

                //the example token for SUM operator is ['T1C2', 'T1C3', ',', 'LEFT']
                //'T1C2', 'T1C3', ',' will be in the stack, so first popout the , then operate on the ending and starting LEFT operators
                const comma_operand_left = evalStack.pop().trim();

                operand2 = evalStack.pop().trim();
                operand1 = evalStack.pop().trim();

                evaluatedResult = "('" + operand1 + "'.substring(0," + operand2 + "))";

                evalStack.push(evaluatedResult);
                break;
            //-- LEFT end 

            //-- RIGHT start        
            case 'RIGHT':

                //the example token for SUM operator is ['T1C2', 'T1C3', ',', 'RIGHT']
                //'T1C2', 'T1C3', ',' will be in the stack, so first popout the , then operate on the ending and starting RIGHT operators
                const comma_operand_right = evalStack.pop().trim();

                operand2 = evalStack.pop().trim();
                operand1 = evalStack.pop().trim();

                evaluatedResult = "('" + operand1 + "'.slice(-" + operand2 + "))";

                evalStack.push(evaluatedResult);
                break;
            //-- RIGHT end 


            //Default behivour of the token, just add it to the stack
            default:
                evalStack.push(token.trim());

        }

        //display the value of the evalStack after the token is processed 

    } //end of for loop



    if (typeof (evalStack[0]) != "object") {

        outputresultJSON = '{"SCRIPT" : "' + evalStack[0] + '"}';
        outputresult = JSON.parse(outputresultJSON);
        evalStack[0] = outputresult;

    }

    // The final result will be at the top of the stack  
    return evalStack[0];
}

function splitIdString(idString) {

    //the regex returns a array matching the table name with id example with the cell name T1A24 it returns the table name in the first index
    const tablePart_tmp = idString.match(/T(\d+)/);


    const cellPart_tmp = idString.match(/T(\d+)([A-Z]\d+)/).slice(1);

    const tablePart = tablePart_tmp[0];
    const cellPart = cellPart_tmp[1];

    const cellId_tmp = cellPart.match(/([A-Z])(\d+)/);

    //This regex returns the CellId character part and Cellid number part
    const cellId_Char_Part = cellId_tmp[1];
    const cellId_Number_Part = parseInt(cellId_tmp[2]);

    //Return the ASCII character code of the CellId character part
    const cellId_Char_Part_charCode = cellId_Char_Part.charCodeAt(0);

    return { tablePart, cellPart, cellId_Char_Part, cellId_Number_Part, cellId_Char_Part_charCode };
}

function trimIfString(value) {
    if (typeof value === 'string') {
        return value.trim();
    }
    return value;
}

// Example usage:
//const inputFormula = "2 + 3 * 4";
//const inputFormula = "2 + 3";
//const inputFormula = "2.0 + 3";
//const inputFormula = "SUM(A1:B1)";
//const inputFormula = "(A1:B1)";
//const inputFormula = "NORM(A1 + B2 + C3) / POWER(C2,2)";
//const inputFormula = "NORMDIST(23,3,5)";
//const inputFormula = "SQRT(23)";
//const inputFormula = "SQRT(POWER(A1-B1,2))";
//const inputFormula = "POWER(25,2)";  //25 2 , POWER
//const inputFormula = "SQRT(25)"
//const inputFormula = "2 ^ 3";

function parseFormula(inputCellid, inputFormula) {

    const formulaContent = inputFormula.split(/[\(\)]/);
    const title = ['HEADER', 'TEXT', 'NOTE'];

    if (title.includes(formulaContent[0].trim())) {
        const regex = new RegExp(`${formulaContent[0].trim()}\\((.*)\\)`);
        const content = inputFormula.match(regex);
        let operands_formula_script = { [formulaContent[0].trim()]: content[1].trim() };
        return operands_formula_script;
    }

    let tokens = tokenize(trimIfString(inputFormula));

    //Replaced with output of tokenize function
    let inputTokens = tokens;
    let rpnTokens = shuntingYard(inputTokens);

    let operands_formula_script = evaluateRPN(inputCellid, rpnTokens);

    return operands_formula_script;

}

export { parseFormula };
