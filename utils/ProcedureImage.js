const path = require('path');
const fs = require('fs');
const { imageSize } = require('image-size');



// async function generateImageContent(procedureimages) {
//     const content = [];

//     if (!procedureimages || !Array.isArray(procedureimages)) {
//         return content;
//     }

//     try {
//         const imageBuffers = await Promise.all(
//             procedureimages
//                 .filter(image => typeof image === 'string')
//                 .map(async (image) => {
//                     try {
//                         const imagePath = path.resolve(__dirname, `../public/procedure_images/${image.trim()}`);
//                         return await imageToBuffer(imagePath);
//                     } catch (error) {
//                         console.error(`Error loading image ${image}:`, error);
//                         return false;
//                     }
//                 })
//         );

//         const validImageBuffers = imageBuffers.filter(buffer => buffer !== false);

//         if (validImageBuffers.length > 0) {
//             for (const imageData of validImageBuffers) {
//                 content.push({
//                     stack: [
//                         {
//                             text: 'PROCEDURE DIAGRAM',
//                             alignment: 'center',
//                             bold: true,
//                             fontSize: 10,
//                             margin: [0, 0, 0, 5]
//                         },
//                         {
//                             image: imageData,
//                             width: 500, // Adjust width to fit A4 with some padding (max ~550)
//                             alignment: 'center',
//                             margin: [0, 0, 0, 15]
//                         }
//                     ],
//                     alignment: 'center',
//                     margin: [0, 10, 0, 10]
//                 });
//             }
//         }
//     } catch (error) {
//         console.error('Error generating image content:', error);
//     }

//     return content;
// }



async function imageToBuffer(imagePath) {
    try {
        if (!fs.existsSync(imagePath)) {
            console.error(`❌ File not found: ${imagePath}`);
            return false;
        }

        const fileBuffer = fs.readFileSync(imagePath);
        const ext = path.extname(imagePath).toLowerCase().replace('.', '');

        // ✅ Supported formats
        const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];
        if (!allowedTypes.includes(ext)) {
            console.error(`❌ Unsupported file type: ${ext} -> ${imagePath}`);
            return false;
        }

        return `data:image/${ext};base64,${fileBuffer.toString('base64')}`;
    } catch (error) {
        console.error('❌ Error converting image to base64:', error);
        return false;
    }
}


async function generateImageContent(procedureimages) {
    const content = [];

    if (!procedureimages || !Array.isArray(procedureimages)) {
        return content;
    }

    try {
        const imageBuffers = await Promise.all(
            procedureimages
                .filter(image => typeof image === 'string' && image.trim() !== '')
                .map(async (image) => {
                    try {
                        const imagePath = path.resolve(__dirname, `../public/procedure_images/${image.trim()}`);

                        if (!fs.existsSync(imagePath)) {
                            console.warn(`⚠️ Skipping missing image: ${imagePath}`);
                            return false;
                        }

                        const fileBuffer = fs.readFileSync(imagePath);
                        let dimensions;
                        try {
                            dimensions = imageSize(fileBuffer);
                        } catch (error) {
                            console.error(`❌ Failed to read dimensions for ${image}:`, error);
                            return false;
                        }

                        const buffer = await imageToBuffer(imagePath);
                        if (!buffer) return false;

                        return { buffer, dimensions };
                    } catch (error) {
                        console.error(`❌ Error loading image ${image}:`, error);
                        return false;
                    }
                })
        );

        const validImages = imageBuffers.filter(Boolean);

        if (validImages.length === 1) {
            // ✅ Single Image → Print normally
            const img = validImages[0];
            const maxWidth = 450;
            let finalWidth = Math.min(img.dimensions.width, maxWidth);
            let finalHeight = (img.dimensions.height / img.dimensions.width) * finalWidth;

            content.push({
                stack: [
                    // {
                    //     text: 'PROCEDURE DIAGRAM',
                    //     alignment: 'center',
                    //     bold: true,
                    //     fontSize: 10,
                    //     margin: [0, 0, 0, 5]
                    // },
                    {
                        image: img.buffer,
                        width: finalWidth,
                        height: finalHeight,
                        alignment: 'center',
                        margin: [0, 0, 0, 5]
                    }
                ],
                alignment: 'center',
                margin: [0, 10, 0, 5]
            });
        }
        else if (validImages.length === 2) {
            // ✅ Two Images → Side by Side
            const maxWidthPerImage = 220; // Half of A4 width roughly (500 / 2 - 15)
            const row = [];

            for (const img of validImages) {
                let width = Math.min(img.dimensions.width, maxWidthPerImage);
                let height = (img.dimensions.height / img.dimensions.width) * width;

                row.push({
                    image: img.buffer,
                    width,
                    height,
                    margin: [5, 0, 5, 0],
                    alignment: 'center'
                });
            }

            content.push({
                stack: [
                    // {
                    //     text: 'PROCEDURE DIAGRAM',
                    //     alignment: 'center',
                    //     bold: true,
                    //     fontSize: 10,
                    //     margin: [0, 0, 0, 5]
                    // },
                    {
                        columns: row,
                        columnGap: 10,
                        alignment: 'center',
                        margin: [0, 0, 0, 15]
                    }
                ],
                alignment: 'center',
                margin: [0, 10, 0, 10]
            });
        } else {
            for (const img of validImages) {
                const maxWidth = 450;
                let finalWidth = Math.min(img.dimensions.width, maxWidth);
                let finalHeight = (img.dimensions.height / img.dimensions.width) * finalWidth;

                content.push({
                    stack: [
                        // {
                        //     text: 'PROCEDURE DIAGRAM',
                        //     alignment: 'center',
                        //     bold: true,
                        //     fontSize: 10,
                        //     margin: [0, 0, 0, 5]
                        // },
                        {
                            image: img.buffer,
                            width: finalWidth,
                            height: finalHeight,
                            alignment: 'center',
                            margin: [0, 0, 0, 10]
                        }
                    ],
                    alignment: 'center',
                    margin: [0, 10, 0, 10]
                });
            }
        }
    } catch (error) {
        console.error('❌ Error generating image content:', error);
    }

    return content;
}


module.exports = { generateImageContent };
