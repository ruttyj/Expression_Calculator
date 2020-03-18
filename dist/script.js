const { ref, computed, watch, onMounted, onUnmounted, reactive } = window.vueCompositionApi;

Vue.config.productionTip = false;
Vue.use(vueCompositionApi.default);

/**
                                     * @TODO
                                     * - When value selected alter value when pressing keypad instead of adding to main input
                                     * - When altering a value allow for expression parsing
                                     * - Allow deleting of a given line 
                                     *   - if other are associated to node then dissalow.
                                     *   - update references to the following expression affected by the deletion
                                     * - Add variable definition
                                     * - allow custom function definition
                                     * - Add keys for floor and ceil functions
                                     * - Add mutator and setters to allow for "," seperated numbers ex: "1,000"
                                     * ✅ - add regex to replace num% with percent(num)
                                     * ✅- Add a method to allow adding percent to a base  ex: (base + per%) <---> (base + base*per)
                                     * ✅- Add accuate adding and removing of chars at caret position of main input
                                     * ✅- resolve floating point error: ex 6*1.15 = 6.9 not 6.8999999999999995 or 0.1 + 0.2 = 0.30000000000000004 Resolved by limiting to a percision of 14
                                     * - Wrap the selected expression with () instead of just inserting the text
                                     */



let useColours = () => {
  let alteredLuminance = (R, G, B) => 0.2126 * R + 0.7152 * G + 0.0722 * B;
  let hexToRgb = hex => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    console.log('hex'.hex, result);
    return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)] :
    null;
  };
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
  /**
         * Converts an HSL color value to RGB. Conversion formula
         * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
         * Assumes h, s, and l are contained in the set [0, 1] and
         * returns r, g, and b in the set [0, 255].
         *
         * @param   {number}  h       The hue
         * @param   {number}  s       The saturation
         * @param   {number}  l       The lightness
         * @return  {Array}           The RGB representation
         */
  let hslToRgb = (h, s, l) => {
    var r, g, b;
    h = h / 360;
    s = s / 100;
    l = l / 100;

    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };
  /**
          * Converts an RGB color value to HSL. Conversion formula
          * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
          * Assumes r, g, and b are contained in the set [0, 255] and
          * returns h, s, and l in the set [0, 1].
          *
          * @param   {number}  r       The red color value
          * @param   {number}  g       The green color value
          * @param   {number}  b       The blue color value
          * @return  {Array}           The HSL representation
          */
  let rgbToHsl = (r, g, b) => {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b),min = Math.min(r, g, b);
    var h,s,l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:h = (g - b) / d + (g < b ? 6 : 0);break;
        case g:h = (b - r) / d + 2;break;
        case b:h = (r - g) / d + 4;break;}

      h /= 6;
    }

    return [h, s, l];
  };
  let contrastTextColour = (hex, darkColour = '#000000', lightColour = '#ffffff', threshold = 128) => {
    // Source: http://www.webmasterworld.com/r.cgi?f=88&d=9769&url=http://www.w3.org/TR/AERT#color-contrast
    const stripHash = h => h.charAt(0) == "#" ? h.substring(1, 7) : h;
    const sHex = stripHash(hex);
    const base = 16;
    const red = parseInt(sHex.substring(0, 2), base);
    const green = parseInt(sHex.substring(2, 4), base);
    const blue = parseInt(sHex.substring(4, 6), base);
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
    if (brightness > threshold)
    return darkColour;
    return lightColour;
  };


  var baseHue = 75;
  var colourCounter = baseHue;

  let getNextHsl = () => {
    let hue;

    colourCounter = colourCounter + 37;

    hue = colourCounter % 360;
    if (250 < hue && hue < 290 || 300 < hue && hue < 340 || 100 < hue && hue < 130 || 70 < hue && hue < 90 || 215 < hue && hue < 240) {
      colourCounter += 30;
      hue = colourCounter % 360;
    }

    let saturation = 100;
    let lightness = 40; //0 + (0 + Math.floor((360+colourCounter-baseHue)/360)*37) % 45;

    return [hue, saturation, lightness];
  };


  let lastColour = null;
  let getNextColor = () => {
    let [hue, saturation, lightness] = getNextHsl();
    saturation = 100;

    let RBG;
    let currentalteredLuminance;

    RBG = hslToRgb(hue, saturation, lightness);
    currentalteredLuminance = alteredLuminance(...RBG);
    if (currentalteredLuminance < 125) {
      lightness = Math.min(lightness + (255 - currentalteredLuminance) / 7, 100);
      RBG = hslToRgb(hue, saturation, lightness);
      currentalteredLuminance = alteredLuminance(...RBG);
    }


    let hex = rgbToHex(...RBG);
    let scaledHex = hex;

    // Prevent duplicates in cycle
    if (lastColour == scaledHex) {
      return getNextColor();
    } else {
      lastColour = scaledHex;
    }

    return hex;
  };


  return {
    getNextColor };

};




let makeNodeController = () => {
  let exNode = math.expression.node;

  let nodeTopId = 0;
  let nodeMap = ref({});

  let opLookUp = {
    '+': 'add',
    '-': 'subtract',
    '/': 'divide',
    '*': 'multiply',
    '^': 'pow' };


  let standardOpts = ['+', '-', '*', '/', '^'];



  let isNodeStandardOp = node => {
    return typeof node.op !== 'undefined' && standardOpts.includes(node.op);
  };



  let expressionScope = ref({});


  let reset = () => {
    nodeMap.value = {};
    nodeTopId = 0;
  };

  let updateNodeAttr = (id, pairs) => {
    let node = nodeMap.value[String(id)];
    nodeMap.value[id] = { ...node, ...pairs };
    nodeMap.value = { ...nodeMap.value };
  };

  let onSort = (parentId, args) => {
    if (typeof args.moved !== 'undefined') {
      let oldIndex = args.moved.oldIndex;
      let newIndex = args.moved.newIndex;

      let oldOrder = nodeMap.value[parentId].argIds;
      let oldMaxIndex = oldOrder.length - 1;
      let newOrder = [...oldOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, oldOrder[oldIndex]);
      nodeMap.value[parentId].argIds = newOrder;
      nodeMap.value = { ...nodeMap.value };
    }
    //@TODO dragged to differnt parent node
  };


  // Create an association between nodes

  let attachRef = (id, argId) => {
    if (typeof nodeMap.value[argId] !== 'undefined') {
      if (typeof nodeMap.value[argId].assoc === 'undefined')
      nodeMap.value[argId].assoc = {};
      nodeMap.value[argId].assoc[id] = true;
    }
  };

  let attachAssoc = data => {
    let id = data.id;
    if (typeof data.argIds !== 'undefined') {
      data.argIds.map(argId => attachRef(id, argId));
    }
    if (typeof data.contentId !== 'undefined') {
      attachRef(id, data.contentId);
    }
  };

  let hasRefs = id => {
    if (typeof nodeMap.value[id] !== 'undefined')
    if (typeof nodeMap.value[id].assoc !== 'undefined')
    return Object.keys(nodeMap.value[id].assoc) > 0;
    return false;
  };

  let getAssoc = data => {
    let result = [];
    if (typeof data.assoc !== 'undefined') {
      result = Object.keys(data.assoc);
    }
    return result;
  };

  let removeRef = (id, refId) => {
    if (typeof nodeMap.value[id] !== 'undefined')
    if (typeof nodeMap.value[id].assoc !== 'undefined')
    if (typeof nodeMap.value[id].assoc[refId] !== 'undefined')
    delete nodeMap.value[id].assoc[refId];
  };

  let getChildren = data => {
    let results = [];
    if (typeof data.argIds !== 'undefined') {
      data.argIds.map(argId => {
        results.push(argId);
      });
    }
    if (typeof data.contentId !== 'undefined') {
      results.push(data.contentId);
    }
    return results;
  };

  //---------------------------------



  let createNodeRef = data => {
    let node = createNode(data);
    return node.id;
  };


  let createNode = data => {
    let id = ++nodeTopId;
    let temp = {
      ...data,
      id: id };

    attachAssoc(temp);
    nodeMap.value[id] = temp;
    return temp;
  };



  let deleteNode = nodeId => {
    let targetNode = nodeMap.value[nodeId];

    let children = getChildren(targetNode).map(childId => deleteNode(childId));
    children.map(childId => {
      removeRef(childId, nodeId);
      if (!hasRefs(childId))
      delete nodeMap.value[childId];
    });

    delete nodeMap.value[nodeId];
  };


  // Build a Tree compatible with the interface
  let buildTreeNode = (nodeId, buildHistory = {}) => {
    let result = {};

    // Prevent circular looping
    if (typeof buildHistory[nodeId] === 'undefined') {
      buildHistory[nodeId] = true;

      if (typeof nodeMap.value[nodeId] !== 'undefined') {
        let node = nodeMap.value[nodeId];

        // Shallow clone
        result = { ...node };

        // Associate arguments
        if (typeof result.argIds !== 'undefined') {
          delete result.argIds;
          result.args = node.argIds.map(argId => buildTreeNode(argId, buildHistory)).filter(valid => valid);
        }

        // Associate content
        if (typeof node.type !== 'undefined') {

          if (node.type === 'parenthesis') {
            if (typeof result.contentId !== 'undefined')
            delete result.contentId;
            result.content = buildTreeNode(node.contentId, buildHistory);
          }

          if (node.type === 'let') {
            result.content = buildTreeNode(node.contentId, buildHistory);
          }
        }
      }

    }
    return result;
  };


  function normalizeMathJsTree(node) {
    let id;

    let args = [];
    if (typeof node.args !== 'undefined' && Array.isArray(node.args)) {
      args = node.args.map(child => normalizeMathJsTree(child));
    }

    let additiveOps = ['+', '-'];
    let isPercentNode = node => typeof node.fn !== 'undefined' && node.fn.name === 'percent';
    if (standardOpts.includes(node.op)) {
      // if only one argument and op is [+-] replace with constant
      if (args.length === 1 && additiveOps.includes(node.op) && typeof node.args[0].value !== 'undefined') {
        let sign = node.op === '-' ? -1 : 1;
        id = createNodeRef({
          type: 'const',
          value: sign * node.args[0].value });

      } else {
        // If adding or subtracting a percentage change the parsed function
        let isSpecialCase = false;
        if (args.length === 2 && additiveOps.includes(node.op)) {

          let isArg0Percent = isPercentNode(node.args[0]);
          let isArg1Percent = isPercentNode(node.args[1]);

          // XOR
          if (!(isArg0Percent && isArg1Percent) && (isArg0Percent || isArg1Percent)) {
            isSpecialCase = true;

            // Add an arg to indicate the sub operation +-
            args.push(createNodeRef({
              type: 'const',
              value: node.op === '-' ? '-' : '+' }));

            // add arg to indicate which arg the percent will be passed as
            args.push(createNodeRef({
              type: 'const',
              value: isPercentNode(node.args[1]) ? 1 : 0 }));

            id = createNodeRef({
              type: 'func',
              name: 'plusPercent',
              argIds: args });

          } // end XOR

        }

        if (!isSpecialCase) {
          // If only has one argument substitute in 0 for the first arg
          if (args.length === 1) {
            args.unshift(createNodeRef({
              type: 'const',
              value: 0 }));

          }
          id = createNodeRef({
            type: 'op',
            op: node.op,
            argIds: args });

        }
      }

    } else if (typeof node.fn !== 'undefined') {
      id = createNodeRef({
        type: 'func',
        name: node.fn.name,
        argIds: args });

    } else if (typeof node.object !== 'undefined') {
      id = createNodeRef({
        type: 'let',
        name: node.object.name,
        contentId: normalizeMathJsTree(node.value) });

    } else if (typeof node.value !== 'undefined') {
      id = createNodeRef({
        type: 'const',
        value: node.value });

    } else if (typeof node.content !== 'undefined') {
      id = createNodeRef({
        type: 'parenthesis',
        contentId: normalizeMathJsTree(node.content) });

    } else
    if (typeof node.name !== 'undefined') {
      id = createNodeRef({
        type: 'var',
        name: node.name });

    } else {
      console.log('else node', node);
    }


    return id;
  }


  let makeArrayNode = value => new exNode.ArrayNode(value.map(val => new exNode.ConstantNode(val)));
  let makeConstantNode = value => new exNode.ConstantNode(value);

  //@ requires opLookUp
  function processExpression(node, nodeHistory = {}) {
    let refFunctions = ['line', 'node'];

    let args = [];
    let nodeId = node.id || 0;
    if (typeof nodeHistory[nodeId] === 'undefined') {

      // Keep track of callstack
      let currentHistory = Object.keys(nodeHistory);

      // Add to the history 
      nodeHistory[nodeId] = true;

      if (typeof node.args !== 'undefined') {
        args = node.args.map(arg => processExpression(arg, nodeHistory));
      }

      if (node.type === 'op') {
        let name = opLookUp[node.op];
        return new exNode.OperatorNode(node.op, name, args);
      } else if (node.type === 'func') {
        if (refFunctions.includes(node.name)) {
          // pass the call stack to prevent infinate recursion
          return new exNode.FunctionNode(node.name, [...args, makeConstantNode(node.id), makeArrayNode(currentHistory)]);
        } else {
          return new exNode.FunctionNode(node.name, args);
        }
      } else if (node.type === 'var') {
        return new exNode.SymbolNode(node.name);
      } else if (node.type === 'let') {
        return new exNode.AssignmentNode(new exNode.SymbolNode(node.name), processExpression(node.content, nodeHistory));
      } else if (node.type === 'const') {
        return new exNode.ConstantNode(node.value);
      } else if (node.type === 'parenthesis') {
        return new exNode.ParenthesisNode(processExpression(node.content, nodeHistory));
      }
    } else {
      console.log('############### Broke', node, nodeHistory);
    }
    return null;
  }

  let getAns = (nodeId, nodeHistory = {}) => {
    let ans = 0;
    try {
      let history = {};
      let tree = buildTreeNode(nodeId, history);
      let node = processExpression(tree, nodeHistory);

      if (node !== null) {
        ans = node.compile().evaluate(expressionScope.value);
        // Format with percision of 14 and remove dumb quote marks
        ans = math.format(ans, { precision: 14 }).replace('"', '').replace('"', '');
      }
    } catch (e) {
      console.log('error', e);
    }
    return ans;
  };



  return {
    isNodeStandardOp,
    normalizeMathJsTree,
    getAns,
    expressionScope,
    processExpression,
    buildTreeNode,
    reset,
    nodeTopId,
    nodeMap,
    createNode,
    createNodeRef,
    deleteNode,
    updateNodeAttr,
    onSort };

};




let useCalcKeyPad = ({ main_input, root }) => {

  let colours = useColours();
  let standardOpts = ['+', '-', '*', '/', '^'];
  let currentDisplayLine = ref('');

  let expressionQueue = ref([]);
  let nodeController = makeNodeController();
  let expressionTrees = ref({});
  let expressionColor = ref({});
  let expressionParseError = ref(false);

  let expressionScope = nodeController.expressionScope;


  let expressionStringQueue = ref([
  { string: '(2+10)' },
  { string: '1+#1' },
  { string: 'a=45' },
  { string: 'b=17' },
  { string: 'mod(a,b)' },
  { string: 'mod(#3,floor(#3/#5))' }
  /*
                                     
                                     {string: '(2+2)'},
                                     {string: `node(3) + 99`},
                                     {string: `line(2)+5`},
                                     {string: `5+#2`},
                                     {string: `#(1+1) +100`},
                                     */
  //{string: 'b=10'},
  //{string: 'b+50'},
  //{string: 'floor((b/c)*100)/100'},
  ]);


  function setCaretPosition(ctrl, pos) {
    // Modern browsers
    if (ctrl.setSelectionRange) {
      ctrl.focus();
      ctrl.setSelectionRange(pos, pos);

      // IE8 and below
    } else if (ctrl.createTextRange) {
      var range = ctrl.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  }

  function insertAtCaret(txtarea, text, setValue = () => {}, offset = 0) {
    //ref https://stackoverflow.com/questions/1064089/inserting-a-text-where-cursor-is-using-javascript-jquery
    if (!txtarea)
    return;

    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br = txtarea.selectionStart || txtarea.selectionStart == '0' ?
    "ff" : document.selection ? "ie" : false;
    if (br == "ie") {
      txtarea.focus();
      var range = document.selection.createRange();
      range.moveStart('character', -txtarea.value.length);
      strPos = range.text.length;
    } else if (br == "ff") {
      strPos = txtarea.selectionStart;
    }

    var front = txtarea.value.substring(0, strPos);
    var back = txtarea.value.substring(strPos, txtarea.value.length);
    txtarea.value = front + text + back;
    setValue(front + text + back);
    strPos = strPos + text.length + offset;
    if (br == "ie") {
      txtarea.focus();
      var ieRange = document.selection.createRange();
      ieRange.moveStart('character', -txtarea.value.length);
      ieRange.moveStart('character', strPos);
      ieRange.moveEnd('character', 0);
      ieRange.select();
    } else if (br == "ff") {
      txtarea.selectionStart = strPos;
      txtarea.selectionEnd = strPos;
      txtarea.focus();
    }

    txtarea.scrollTop = scrollPos;
  }

  function removeAtCaret(txtarea, len, setValue = () => {}) {
    //ref https://stackoverflow.com/questions/1064089/inserting-a-text-where-cursor-is-using-javascript-jquery
    if (!txtarea)
    return;

    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br = txtarea.selectionStart || txtarea.selectionStart == '0' ?
    "ff" : document.selection ? "ie" : false;
    if (br == "ie") {
      txtarea.focus();
      var range = document.selection.createRange();
      range.moveStart('character', -txtarea.value.length);
      strPos = range.text.length;
    } else if (br == "ff") {
      strPos = txtarea.selectionStart;
    }

    var front = txtarea.value.substring(0, strPos - len);
    var back = txtarea.value.substring(strPos, txtarea.value.length);
    txtarea.value = front + back;
    setValue(front + back);
    strPos = strPos - len;
    if (br == "ie") {
      txtarea.focus();
      var ieRange = document.selection.createRange();
      ieRange.moveStart('character', -txtarea.value.length);
      ieRange.moveStart('character', strPos);
      ieRange.moveEnd('character', 0);
      ieRange.select();
    } else if (br == "ff") {
      txtarea.selectionStart = strPos;
      txtarea.selectionEnd = strPos;
      txtarea.focus();
    }

    txtarea.scrollTop = scrollPos;
  }



  let keyPress = (char, offset = 0) => {
    let addString = char;

    // If main input is empty then take then automatically take previous answer if exists
    if (currentDisplayLine.value.length === 0 && ['+', '-', '*', '/', '^', '%'].includes(char) && expressionQueue.value.length > 0) {
      addString = `#${expressionQueue.value.length}${char}`;
    }

    if (main_input.value !== null) {
      insertAtCaret(main_input.value, addString, newVal => {
        currentDisplayLine.value = newVal;
      }, offset);
    }
  };


  // Increment hue then lumosity
  var baseHue = 60;
  var colourCounter = baseHue;
  let luminance = (R, G, B) => 0.2126 * R + 0.7152 * G + 0.0722 * B;
  let contrastTextColour = (hex, darkColour = '#000000', lightColour = '#ffffff', threshold = 128) => {
    // Source: http://www.webmasterworld.com/r.cgi?f=88&d=9769&url=http://www.w3.org/TR/AERT#color-contrast
    const stripHash = h => h.charAt(0) == "#" ? h.substring(1, 7) : h;
    const sHex = stripHash(hex);
    const base = 16;
    const red = parseInt(sHex.substring(0, 2), base);
    const green = parseInt(sHex.substring(2, 4), base);
    const blue = parseInt(sHex.substring(4, 6), base);
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
    if (brightness > threshold)
    return darkColour;
    return lightColour;
  };
  let getNextColor = colours.getNextColor;


  let processExpressionString = (str, nodeController) => {

    let temp = str;

    // Replace implied multiplication
    temp = temp.replace(/(\))([a-z])/gi, '$1*$2');
    temp = temp.replace(/(?<![A-Za-z])([0-9]+)(\()/gi, '$1*$2');


    // Replace #num with line(num) 
    temp = temp.replace(/#([0-9]+|\([^\}]+\))/gi, ' line($1)');

    // Replace num% with percent(num)
    temp = temp.replace(/([^\+\*\/\-\s]*)%/gi, ' percent($1)');





    let nodeId = undefined;
    try {
      nodeId = nodeController.normalizeMathJsTree(math.parse(temp));
      expressionQueue.value.push(nodeId);
      expressionColor.value[nodeId] = getNextColor();

      //@DEBUG
      expressionTrees.value[nodeId] = nodeController.buildTreeNode(nodeId, nodeController);
      expressionParseError.value = false;
    } catch (e) {
      console.log('could not parse', str);
      expressionParseError.value = true;
    }
    return nodeId;
  };

  // mathJs custom function to execute a desired node while preventing infinate recursion
  let safeExecuteRefNode = (nodeId, parentId, arrNodeHistory) => {
    let historyLength = arrNodeHistory._data.length;
    let historyMap = arrNodeHistory._data.reduce((acc, cur) => {
      acc[String(cur)] = true;
      return acc;
    }, {});

    // If has not encountered this node in the current callstack
    if (typeof historyMap[String(parentId)] === 'undefined') {
      // Add node to history 
      let newMap = { ...historyMap };
      newMap[String(parentId)] = true;

      // Execure recursive call
      return nodeController.getAns(nodeId, newMap);
    }
  };

  math.import({
    myConstant: 42,
    node: function (expressionNodeId, parentId, arrNodeHistory) {
      let nodeMap = nodeController.nodeMap.value;
      if (typeof nodeMap[expressionNodeId] !== 'undefined') {
        return safeExecuteRefNode(expressionNodeId, parentId, arrNodeHistory);
      }
      return 0;
    },
    line: function (line, parentId, arrNodeHistory) {
      if (typeof expressionQueue.value[line - 1] !== 'undefined') {
        // Get the Root Node of the expression at line
        let expressionNodeId = expressionQueue.value[Math.max(0, line - 1)];

        return safeExecuteRefNode(expressionNodeId, parentId, arrNodeHistory);
      }
      return 0;
    },
    //
    percent: function (qty) {
      return parseFloat(qty) / 100;
    },
    // plusPercent(200, 0.15, '+', 1) <-> 200 + 15% <-> 230
    plusPercent: function (A, B, sign = '+', percentIndex) {
      let base = parseFloat(percentIndex === 1 ? A : B);
      let per = parseFloat(percentIndex === 1 ? B : A);
      let scaler = sign === '-' ? -1 : 1;
      return base + scaler * base * per;
    } });

  //----------------------------



  expressionStringQueue.value.map((expression, i) => {
    processExpressionString(expression.string, nodeController);
  });











  let enterPress = () => {
    if (String(currentDisplayLine.value).length > 0) {
      processExpressionString(currentDisplayLine.value, nodeController);
    }
    if (expressionParseError.value === false)
    currentDisplayLine.value = '';

    if (main_input.value !== null) {
      main_input.value.focus();
    }
  };

  let clearCurrentLine = () => {
    if (currentDisplayLine.value === '') {
      if (expressionQueue.value.length > 0) {
        let lastExpressionId = expressionQueue.value[expressionQueue.value.length - 1];
        nodeController.deleteNode(lastExpressionId);
        expressionQueue.value.splice(-1, 1);
        delete expressionColor.value[lastExpressionId];
        delete expressionTrees.value[lastExpressionId];
      }
    } else {
      currentDisplayLine.value = '';
    }
    nodeController.expressionScope.value = {};
  };

  let backspace = () => {

    removeAtCaret(main_input.value, 1, newVal => {
      currentDisplayLine.value = newVal;
    });
  };




  return {
    expressionParseError,
    expressionTrees,
    expressionColor,
    expressionQueue,
    nodeController,
    getAns: nodeController.getAns,
    expressionScope,
    expressionStringQueue,
    currentDisplayLine,
    clearCurrentLine,
    keyPress,
    enterPress,
    backspace };

}; // end calc key pad





let commonTheme = {
  primary: '#17ab01',
  secondary: '#b0bec5',
  accent: '#8c9eff',
  error: '#b71c1c' };


let vuetifyOpts = {
  theme: {
    themes: {
      light: {
        ...commonTheme },

      dark: {
        ...commonTheme } } } };









let node = {
  template: '#node',
  props: ['node', 'scope', 'nodeMap', 'root', 'nodeController'],
  setup(props, { emit }) {

    let root = props.root || props.nodeTree;


    let inputSize = val => {
      return String(val).length || 1;
    };

    let removeArg = item => {
      console.log('removeArg', { ...item });
    };

    return {
      inputSize,
      removeArg,
      diminished: ref('#3d3d3d') };

  } };





let nodeDisplay = {
  template: '#nodeDisplay',
  props: {
    'node': {},
    'scope': {},
    'nodeMap': {},
    'root': {},
    'nodeController': {},
    'selectedNode': { default: null },
    'modifyingNode': { default: null },
    'expressionColor': { default: () => ({}) },
    'color': { default: null },
    'calcKeyPad': { default: null } },

  mounted() {
    if (typeof this.$refs.input !== 'undefined' && typeof this.$refs.input.$el !== 'undefined') {
      this.$refs.input.$el.focus();
    }
  },
  setup(props, { emit }) {

    let modifyingId = computed({
      get() {
        return props.modifyingNode;
      },
      set(val) {
        console.log('modifyingId', val);
        emit('update:modifying-node', val);
      } });

    let selectedId = computed({
      get() {
        return props.selectedNode;
      },
      set(val) {
        emit('update:selected-node', val);
      } });


    let isModifying = id => {
      let items = modifyingId.value || [];
      return items.includes(id);
    };

    let toggleIsModifying = id => {
      let items = modifyingId.value || [];
      const index = items.indexOf(id);

      if (index > -1) {
        let newOrder = [...items];
        newOrder.splice(index, 1);
        modifyingId.value = newOrder;
      } else {
        modifyingId.value = [...items, id];
      }
    };

    let clearModifying = id => {
      modifyingId.value = [];
    };

    let isNodeStandardOp = props.nodeController.isNodeStandardOp;


    let root = props.root || props.nodeTree;


    let inputSize = val => {
      return String(val).length || 1;
    };

    let removeArg = item => {
      console.log('removeArg', { ...item });
    };

    let toggleSelected = id => {
      if (selectedId.value === id) {
        selectedId.value = null;
      } else {
        selectedId.value = id;
      }
    };

    let getExpressionColor = id => {
      return props.expressionColor[id] || props.color || null;
    };

    return {
      getExpressionColor,
      isModifying,
      toggleIsModifying,
      clearModifying,
      toggleSelected,
      modifyingId,
      selectedId,
      isNodeStandardOp,
      inputSize,
      removeArg,
      diminished: ref('#3d3d3d') };

  } };





Vue.component('node', node);
Vue.component('draggable', window.vuedraggable);
Vue.component('node-display', nodeDisplay);



new Vue({
  el: '#app',
  vuetify: new Vuetify(vuetifyOpts),
  components: {},

  created() {
    this.$vuetify.theme.dark = true;
  },
  setup(props, { root }) {
    let main_input = ref(null);

    let modifyingId = ref(null);
    let selectedId = ref(null);

    let calcKeyPad = useCalcKeyPad({
      main_input,
      root });


    let getExpressionColor = id => {
      return calcKeyPad.expressionColor.value[id] || '#17ab01';
    };

    return {
      main_input,
      getExpressionColor,
      modifyingId,
      selectedId,
      calcKeyPad: calcKeyPad };

  } }).
$mount('#app');