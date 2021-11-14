using CalculatePollution.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace CalculatePollution.Service
{
    public class Output
    {
        public int Id { get; set; }
        public string Distance { get; set; }
        public string Duration { get; set; }
        public double Pollution { get; set; }
        public double MeanPollution { get; set; }
        public PointModel MaxPollution { get; set; }
    }
}