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
