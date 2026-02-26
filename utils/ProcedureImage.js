const path = require('path');
const fs = require('fs');
const { imageSize } = require('image-size');

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
                .filter(img => img && (typeof img === "string" || img.name))
                .map(async (imgObj) => {
                    try {

                        const imageName = typeof imgObj === "string"
                            ? imgObj
                            : imgObj.name;


                        if (!imageName) return false;


                        const imagePath = path.resolve(__dirname, `../public/procedure_images/${imageName.trim()}`);

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

                        return {
                            buffer,
                            dimensions,
                            userWidth:
                                typeof imgObj === "object" ? imgObj.width : null,
                            userHeight:
                                typeof imgObj === "object" ? imgObj.height : null,
                        };
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
            const userWidth = img.userWidth
            const userHeight = img.userHeight
            const maxWidth = 300;
            let finalWidth = userWidth || Math.min(img.dimensions.width, maxWidth);
            let finalHeight = userHeight || (img.dimensions.height / img.dimensions.width) * finalWidth;

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
                        margin: [0, 0, 0, 0]
                    }
                ],
                alignment: 'center',
                margin: [0, 2, 0, 2]
            });
        }
        else if (validImages.length === 2) {


            const maxWidthPerImage = 200;

            const imageColumns = validImages.map(img => {
                let userwidth = img.userWidth;
                let userheight = img.userHeight;
                let width = userwidth ? userwidth : Math.min(img.dimensions.width, maxWidthPerImage);
                let height = userheight ? userheight : (img.dimensions.height / img.dimensions.width) * width;

                return {
                    image: img.buffer,
                    width,
                    height,
                    alignment: 'center'
                };
            });

            content.push({
                columns: [
                    { width: '*', text: '' },   // left spacer
                    {
                        width: 'auto',
                        columns: imageColumns,
                        columnGap: 20
                    },
                    { width: '*', text: '' }    // right spacer
                ],
                margin: [0, 10, 0, 10]
            });
        } else {
            for (const img of validImages) {
                const userWidth = img.userWidth
                const userHeight = img.userHeight
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
