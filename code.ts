// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

// TODO: only add the colors to styles if they exist already

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg) => {
  let colors : Coolor[] = []
  if (msg.parse === 'code')
    colors = parseCodeExport(msg.data)
  
  colors.length > 0 
    ? createStyles(colors)
    : console.error("Error parsing colors")
  
  if (msg?.display)
    await displayPalette(colors)
  
  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};

interface Coolor {
  name: string,
  hex: string,
  rgb: number[],
  cmyk: number[],
  hsb: number[],
  hsl: number[],
  lab: number[],
  figmaStyleID?: string
}

function toRGB(rgbArray: number[]) : RGB{
  const rgb = rgbArray.map(num => num / 255)
  return {r: rgb[0], g: rgb[1], b: rgb[2]}
}

function parseCodeExport(code : string) : Coolor[] {
  console.log('input', code)
  // extract from lines of input, the data we want
  const extract = (arr : string[], search : string) : string => {
    const i = arr.findIndex((element) => element.includes(search))
    return arr[i + 1]
  } 

  const lines = code.split('\r\n')
  const colors : Coolor[] = JSON.parse(extract(lines, "Extended Array"))
  return colors
}

function createStyles(colors : Coolor[]) {
  for (const color of colors) {
    const style = figma.createPaintStyle()
    style.name = color.name
    style.paints = [{type: 'SOLID', color: toRGB(color.rgb)}]

    // This is important when creating the palette display since we need to know the id
    color.figmaStyleID = style.id
  }
}

// creates a frame with the palette
async function displayPalette(colors : Coolor[]) {
  const frame = figma.createFrame()
  const font : FontName = {family: 'Gothic A1', style: 'Regular'}

  frame.resize(1920, 1080)
  await figma.loadFontAsync(font)

  for (const color of colors) {
    const text = figma.createText()
    const circle = figma.createEllipse()

    text.fontName = font
    text.characters = color.name
    // display Palette always runs after parsing and creating of styles, so the style id should exist
    circle.fillStyleId = color.figmaStyleID!


    // create a group
    const group = figma.group([circle, text], frame)
    group.name = color.name
  }

}
