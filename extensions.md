# Importing Extensions

To import extensions you have to open your extensions data file. You can access it at File > BirdyImg Extensions > Open Extensions File.

After you opened file put the path (without quotes) of the manifest json you want to import.

Warning (If you are gonna import more than 1 extensions): Extensions should be separated with |

# Making Extensions
## Variables
* `_DIR_`: Parent directory of the extension manifest

  Example: `_DIR_/myIcon.png`
## Manifest JSON Properties
* Name: Name of the extension
* Description: Description of the extension
* Icon: Icon of the extension (40x40 Recomended)
* MainPath: Path of the JavaScript will be executed in main process
* RendererPath: Path of the JavaScript will be executed in renderer procress
* Version: Version of the extension
* Author: Author of the extension

## Main Procress Functions
### addMenuBulidListener
`addMenuBulidListener(function())`: Adds function to listener for creation of the main app menu. The function passed should not have a parameter.
#### Editing menu with it
There are 2 Objects (JSON typed):
* `menu_design`: JSON for main app menu
* `editormenu_design`: JSON for editor menu
### addWindowLoadedListener
`addWindowLoadedListener(function())`: Adds function to listener for when page/app is loaded. The function passed should not have a parameter.

# Example Extension
https://drive.google.com/file/d/1NWP5Uv4sUBft3OAPKT1J1GMwFrZfJXZq/view?usp=share_link
