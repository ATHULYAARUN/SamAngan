const mongoose = require('mongoose');

const ashaVisitSchema = new mongoose.Schema({
  // ASHA Worker Information
  ashaArea: {
    type: String,
    required: [true, 'ASHA area is required'],
    trim: true,
  },
  
  ashaName: {
    type: String,
    trim: true,
  },
  
  // Visit Information
  visitDate: {
    type: Date,
    required: [true, 'Visit date is required'],
    default: Date.now,
  },
  
  // Person Details
  personType: {
    type: String,
    required: [true, 'Person type is required'],
    enum: {
      values: ['child', 'woman', 'adolescent'],
      message: 'Person type must be child, woman, or adolescent'
    }
  },
  
  personName: {
    type: String,
    required: [true, 'Person name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  
  age: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [120, 'Please enter a valid age'],
  },
  
  // Health Metrics
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative'],
    max: [500, 'Please enter a valid weight'],
  },
  
  height: {
    type: Number,
    min: [0, 'Height cannot be negative'],
    max: [300, 'Please enter a valid height'],
  },
  
  hemoglobin: {
    type: Number,
    min: [0, 'Hemoglobin cannot be negative'],
    max: [25, 'Please enter a valid hemoglobin level'],
  },
  
  bloodPressure: {
    type: String,
    trim: true,
    match: [/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must be in format XXX/XX'],
  },
  
  // Vaccination Details
  vaccination: {
    type: {
      type: String,
      trim: true,
    },
    dose: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
    }
  },
  
  // Nutrition Supplements
  supplements: {
    iron: {
      type: Boolean,
      default: false,
    },
    vitaminA: {
      type: Boolean,
      default: false,
    },
    deworming: {
      type: Boolean,
      default: false,
    }
  },
  
  // Additional Information
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters'],
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ashaVisitSchema.index({ ashaArea: 1, visitDate: -1 });
ashaVisitSchema.index({ personName: 1 });
ashaVisitSchema.index({ personType: 1 });
ashaVisitSchema.index({ createdAt: -1 });

// Virtual for calculated BMI
ashaVisitSchema.virtual('bmi').get(function() {
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    return (this.weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  return null;
});

// Method to check if visit is recent (within last 30 days)
ashaVisitSchema.methods.isRecent = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.visitDate >= thirtyDaysAgo;
};

// Static method to get visits by area
ashaVisitSchema.statics.getByArea = function(area, limit = 50) {
  return this.find({ ashaArea: area })
    .sort({ visitDate: -1 })
    .limit(limit);
};

// Static method to get visit statistics
ashaVisitSchema.statics.getStatsByArea = async function(area) {
  const stats = await this.aggregate([
    { $match: { ashaArea: area } },
    {
      $group: {
        _id: '$personType',
        count: { $sum: 1 },
        avgWeight: { $avg: '$weight' },
        avgHeight: { $avg: '$height' },
        avgHemoglobin: { $avg: '$hemoglobin' },
      }
    }
  ]);
  return stats;
};

const ASHAVisit = mongoose.model('ASHAVisit', ashaVisitSchema);

module.exports = ASHAVisit;
