using CalculatePollution.Models;
using System.Collections.Generic;

namespace CalculatePollution.Service
{
    public class Rout
    {
        public Rout()
        {
            Path = new List<PointModel>();
        }
        public int Id { get; set; }
        public string Distance { get; set; }
        public string Duration { get; set; }
        public double Pollution { get; set; }
        public PointModel MaxPollution { get; set; }

        public List<PointModel> Path { get; set; }
    }
}