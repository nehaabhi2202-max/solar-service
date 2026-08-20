const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: __dirname + "/.env" });

const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());


// ===============================
// FRONTEND
// ===============================

app.use(express.static(path.join(__dirname, "../frontend")));


// ===============================
// MONGODB
// ===============================

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully! ✅");
  })
  .catch((error) => {
    console.log(
      "MongoDB connection error:",
      error.message
    );
  });


// ===============================
// BOOKING ID GENERATOR
// ===============================

function generateBookingId() {

  return "SOL-" +
    Date.now().toString(36).toUpperCase();

}


// ===============================
// BOOKING SCHEMA
// ===============================

const bookingSchema = new mongoose.Schema({

  bookingId: {
    type: String,
    unique: true
  },

  name: String,

  phone: String,

  service: String,

  address: String,

  status: {
    type: String,

    enum: [
      "Pending",
      "Confirmed",
      "Completed",
      "Cancelled"
    ],

    default: "Pending"
  },


  // Appointment

  appointmentDate: {
    type: String,
    default: ""
  },

  appointmentTime: {
    type: String,
    default: ""
  },


  createdAt: {
    type: Date,
    default: Date.now
  }

});


const Booking =
  mongoose.model("Booking", bookingSchema);


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "../frontend/index.html"
    )
  );

});


// ===============================
// CREATE BOOKING
// ===============================

app.post(
  "/api/bookings",
  async (req, res) => {

    try {

      const {
        name,
        phone,
        service,
        address
      } = req.body;


      if (
        !name ||
        !phone ||
        !service ||
        !address
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please fill all fields."

        });

      }


      // Generate unique Booking ID

      const bookingId =
        generateBookingId();


      const booking =
        new Booking({

          bookingId,

          name,

          phone,

          service,

          address,

          status: "Pending"

        });


      await booking.save();


      console.log(
        "New booking saved! ✅"
      );

      console.log(
        "Booking ID:",
        bookingId
      );


      res.json({

        success: true,

        message:
          "Service request submitted successfully! ☀️",

        bookingId: bookingId

      });

    }


    catch (error) {

      console.log(
        "Booking error:",
        error.message
      );


      res.status(500).json({

        success: false,

        message:
          "Booking save nahi ho paayi."

      });

    }

  }
);


// ===============================
// GET ALL BOOKINGS
// ===============================

app.get(
  "/api/bookings",
  async (req, res) => {

    try {

      const bookings =
        await Booking
          .find()
          .sort({
            createdAt: -1
          });


      res.json(bookings);

    }


    catch (error) {

      console.log(
        "Fetch bookings error:",
        error.message
      );


      res.status(500).json({

        success: false,

        message:
          "Bookings load nahi ho paayi."

      });

    }

  }
);


// ===============================
// GET BOOKING BY BOOKING ID
// ===============================
// ===============================
// GET CUSTOMER BOOKINGS BY PHONE
// ===============================

app.get(
  "/api/bookings/customer/:phone",
  async (req, res) => {

    try {

      const phone = req.params.phone;

      const bookings =
        await Booking
          .find({ phone: phone })
          .sort({ createdAt: -1 });

      res.json({

        success: true,

        bookings: bookings

      });

    }

    catch (error) {

      console.log(
        "Customer bookings error:",
        error.message
      );

      res.status(500).json({

        success: false,

        message:
          "Customer bookings load nahi ho paayi."

      });

    }

  }
);


app.get(
  "/api/bookings/id/:bookingId",
  async (req, res) => {

    try {

      const booking =
        await Booking.findOne({

          bookingId:
            req.params.bookingId

        });


      if (!booking) {

        return res.status(404).json({

          success: false,

          message:
            "Booking not found."

        });

      }


      res.json({

        success: true,

        booking: booking

      });

    }


    catch (error) {

      console.log(
        "Booking search error:",
        error.message
      );


      res.status(500).json({

        success: false,

        message:
          "Booking search nahi ho paayi."

      });

    }

  }
);

// ===============================
// GET CUSTOMER BOOKINGS BY PHONE
// ===============================

app.get(
  "/api/bookings/customer/:phone",
  async (req, res) => {

    try {

      const phone = req.params.phone;

      const bookings = await Booking
        .find({ phone: phone })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        bookings: bookings
      });

    } catch (error) {

      console.log(
        "Customer bookings error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Customer bookings load nahi ho paayi."
      });

    }

  }
);
// ===============================
// UPDATE STATUS
// ===============================

app.put(
  "/api/bookings/:id/status",
  async (req, res) => {

    try {

      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Completed",
        "Cancelled"
      ];

      if (!allowedStatuses.includes(status)) {

        return res.status(400).json({
          success: false,
          message: "Invalid status."
        });

      }

      const booking =
        await Booking.findByIdAndUpdate(
          req.params.id,
          {
            status: status
          },
          {
            new: true
          }
        );

      if (!booking) {

        return res.status(404).json({
          success: false,
          message: "Booking not found."
        });

      }

      console.log(
        `Booking status changed to ${status} ✅`
      );

      res.json({

        success: true,

        message:
          "Booking status updated successfully!",

        booking: booking

      });

    }

    catch (error) {

      console.log(
        "Status update error:",
        error.message
      );

      res.status(500).json({

        success: false,

        message:
          "Status update nahi ho paaya."

      });

    }

  }
);

// ===============================
// SAVE APPOINTMENT
// ===============================

app.put(
  "/api/bookings/:id/appointment",
  async (req, res) => {

    try {

      const {
        appointmentDate,
        appointmentTime
      } = req.body;


      if (
        !appointmentDate ||
        !appointmentTime
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Please select date and time."

        });

      }


      const booking =
        await Booking.findByIdAndUpdate(

          req.params.id,

          {

            appointmentDate:
              appointmentDate,

            appointmentTime:
              appointmentTime

          },

          {
            new: true
          }

        );


      if (!booking) {

        return res.status(404).json({

          success: false,

          message:
            "Booking not found."

        });

      }


      console.log(
        "Appointment saved! ✅"
      );


      console.log(
        appointmentDate,
        appointmentTime
      );


      res.json({

        success: true,

        message:
          "Service appointment saved!",

        booking: booking

      });

    }


    catch (error) {

      console.log(
        "Appointment error:",
        error.message
      );


      res.status(500).json({

        success: false,

        message:
          "Appointment save nahi ho paaya."

      });

    }

  }
);


// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 5000;


app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Server running on http://localhost:${PORT}`
    );

  }
);