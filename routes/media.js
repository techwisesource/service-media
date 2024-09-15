const express = require('express');
const router = express.Router();
const isBase64 = require('is-base64');
const base64Img = require('base64-img');
const fs = require('fs');

const { Media } = require('../models');
const { HOSTNAME } = process.env;

router.get('/', async (req, res) => {
  const media = await Media.findAll({
    attributes: ['id', 'image']
  });

  const mappedMedia = media.map((m) => {
    m.image = `${req.get('host')}/${m.image}`;
    return m;
  })

  return res.json({
    status: 'success',
    data: mappedMedia
  });
});

router.post('/', (req, res) => {
  const image = req.body.image;

  if (!isBase64(image, { mimeRequired: true })) {
    return res.status(400).json({ status: 'error', message: 'invalid base64' });
  }

  base64Img.img(image, './public/images', Date.now(), async (err, filepath) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }

    // cara 1
    const filename = filepath.split("\\").pop().split("/").pop();
    
    // cara 2
    // const filename = filepath.split("/").pop();

    const media = await Media.create({ image: `images/${filename}` });

    return res.json({
      status: 'success',
      data: {
        id: media.id,
        image: `${HOSTNAME}/images/${filename}`
      }
    });

  })
});

router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  const media = await Media.findByPk(id);

  if(!media) {
    return res.status(404).json({status: 'Error Not Found', message: 'Image not found'});
  }

  fs.unlink(`./public/${media.image}`, async (err) => {
    if(err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      })
    };

    await media.destroy();

    return res.json({
      status: 'success',
      message: 'Image deleted'
    })
  })
})

module.exports = router;