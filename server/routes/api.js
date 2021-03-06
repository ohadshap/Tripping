const express = require("express");
const router = express.Router();
const axios = require("axios");
const Trip = require("../models/TripModel");
const Spot = require("../models/SpotModel");
const apiKey = "b20af2a902234cf497d49ca1cf549238";

const converter = async function(url) {
  let result = await axios.get(url);
  return result.data;
};

router.get(`/convert/:name`, async function(req, res) {
  const { name } = req.params;
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${name}&key=${apiKey}`;
  let coordsData = await converter(url);
  const coords = {
    lat: coordsData.results[0].geometry.lat,
    lng: coordsData.results[0].geometry.lng
  };
  res.send(coords);
});

router.get(`/myTrips`, async function(req, res) {
  const trips = await Trip.find({}).populate("spots");
  res.send(trips);
});

router.post(`/trip`, async function(req, res) {
  const tripObj = req.body;
  const trip = new Trip(tripObj);
  await trip.save();
  res.end();
});

router.post(`/spot`, async function(req, res) {
  const spotObj = req.body;
  const spot = new Spot(spotObj);
  await spot.save();
  await Trip.findOneAndUpdate({ name: spot.trip }, { $push: { spots: spot } });
  res.end();
});

router.delete(`/trip/:name`, async function(req, res) {
  const { name } = req.params;
  const trip = await Trip.findOne({ name: name });
  trip.spots.forEach(async function(S) {
    let spotId = S._id;
    await Spot.deleteOne({ _id: spotId });
  });
  await Trip.deleteOne({ name: name });
  res.end();
});

router.delete(`/spot/:id`, async function(req, res) {
  const { id } = req.params;
  const spot = await Spot.findOne({ _id: id });
  const trip = await Trip.findOne({ name: spot.trip });
  const index = trip.spots.findIndex(s => s._id == id);
  trip.spots.splice(index, 1);
  await Trip.findOneAndUpdate({ name: trip.name }, { spots: trip.spots });
  await Spot.deleteOne({ _id: id });
  res.end();
});

router.put(`/spot`, async function(req, res) {
  const spot = req.body;
  await Spot.replaceOne({ _id: spot._id }, spot);
  res.end();
});

router.put(`/trip`,async function(req,res){
  const trip = req.body
  await Trip.replaceOne({_id: trip._id}, trip)
  res.end()
})

module.exports = router;
