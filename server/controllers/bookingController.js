//Function to check availability of selected seats for a movie

import Booking from "../models/Booking.js";
import Show from "../models/Show.js"

const checkSeatsAvailability = async (showId , selectedSeats) => {
    try {
        const showData = await Show.findById(showId)
        if(!showData) return false;

        const occupiedSeats = showData.occupiedSeats;

        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat])

        return !isAnySeatTaken;
    } catch (error) {
        console.log(error.message);
        return false
    }
}

export const createBooking = async (req , res) => {
    try {
        const {userId} = req.auth();
        const {showId , selectedSeats} = req.body;
        const {origin} = req.headers;

        //Check if the seat is available for the selected view
        const isAvailable = await checkSeatsAvailability(showId , selectedSeats)

        if(!isAvailable) {
            return res.json({success : false , message : "Selected seats are not available"})
        }

        //Get the show details
        const showData = await Show.findById(showId).populate('movie');

        //Create a new booking
        const booking = await Booking.create({
            user : userId,
            show : showId,
            amount : showData.showPrice * selectedSeats.length,
            bookedSeats : selectedSeats
        })

        selectedSeats.map((seat) => {
            showData.occupiedSeats[seat] = userId;
        })

        showData.markModified('occupiedSeats')

        await showData.save()

        //Stripe Gateway Initialize

        res.json({success : true , message : "Booked Successfully"})

    } catch (error) {
        console.log(error.message);
        res.json({success : false , message : error.message})
    }
}

export const getOccupiedSeats = async (req , res) => {
    try {

        const {showId} = req.params;
        const showData = await Show.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.json({success : true , occupiedSeats})
        
    } catch (error) {
        console.log(error.message);
        res.json({success : false , message : error.message})
    }
}