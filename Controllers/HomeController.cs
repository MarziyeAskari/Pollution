using CalculatePollution.Models;
using CalculatePollution.Service;
using OSGeo.GDAL;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.IO;
using System.Linq;
using System.Web.Mvc;

namespace CalculatePollution.Controllers
{
    public class HomeController : Controller
    {

        public ActionResult Index()
        {
            return View();
        }


        [HttpPost]
        public JsonResult GetPath(Data data)
        {

            var path = Server.MapPath("~/GeoTiff");
            var fileAdress = $"{path}/NorthAuckland.tfw";
            var routType = data.TypeRouts;
            double cell = 0;
            double xTop = 0;
            double yTop = 0;
            using (var tfwFile = new StreamReader(new FileStream(fileAdress, FileMode.Open)))
            {
                for (int i = 0; i < 6; i++)
                {
                    var line = tfwFile.ReadLine();
                    switch (i)
                    {
                        case 0:
                            {
                                cell = double.Parse(line);
                                continue;
                            }
                        case 4:
                            {
                                xTop = double.Parse(line);
                                continue;
                            }
                        case 5:
                            {
                                yTop = double.Parse(line);
                                continue;
                            }
                        default:
                            break;
                    }
                }
            }
            List<Rout> pathVertex = new List<Rout>();
            foreach (var rout in data.Routs)
            {
                var newRout = new Rout();
                List<PointModel> newPath = new List<PointModel>();
                newPath.Add(rout.Path[0]);
                for (int i = 0; i < rout.Path.Count - 1; i++)
                {
                    var dY = (rout.Path[i + 1].Y - rout.Path[i].Y);
                    var dX = (rout.Path[i + 1].X - rout.Path[i].X);
                    var length = Math.Sqrt(Math.Pow(dX, 2) + Math.Pow(dY, 2));
                    var ratio = (cell / length);
                    var numSeg = Math.Round(length / cell);
                    double xN = dX * ratio;
                    double yN = dY * ratio;
                    for (int j = 1; j < numSeg + 1; j++)
                    {
                        PointModel newPoint = new PointModel
                        {
                            X = rout.Path[i].X + xN * j,
                            Y = rout.Path[i].Y + yN * j
                        };

                        newPath.Add(newPoint);

                    }
                    newPath.Add(rout.Path[i + 1]);

                }
                newRout.Path = newPath;
                newRout.Id = rout.Id;
                newRout.Distance = rout.Distance;
                newRout.Duration = rout.Duration;
                pathVertex.Add(newRout);
            }
            var value = GetPollutionValue(xTop, yTop, cell, pathVertex);
            var routReport = CalculatePollution(routType, value);
            return Json(routReport);
        }

        public List<Rout> GetPollutionValue(double xTop, double yTop, double cell, List<Rout> listRout)
        {
            List<Rout> pollution = new List<Rout>();
            var path = Server.MapPath("~/GeoTiff");
            var fileAdress = $"{path}\\NorthAuckland.tif";
            Dataset image = Gdal.Open(fileAdress, Access.GA_ReadOnly);
            int Cols = image.RasterXSize;
            int Rows = image.RasterYSize;
            Band band = image.GetRasterBand(1);
            int size = Rows * Cols;
            double[] gt = new double[6];
            image.GetGeoTransform(gt);
            double startX = gt[0];
            double startY = gt[3];
            var cells = new List<string>();
            for (int i = 0; i < listRout.Count; i++)
            {
                var rout = new Rout();
                rout.Id = listRout[i].Id;
                rout.Duration = listRout[i].Duration;
                rout.Distance = listRout[i].Distance;
                pollution.Add(rout);
                for (int j = 0; j < listRout[i].Path.Count; j++)
                {
                    int row = (int)Math.Round((listRout[i].Path[j].X - startX) / cell);
                    int column = (int)Math.Round((startY - listRout[i].Path[j].Y) / cell);

                    if (cells.Any(a => a == $"{row},{column}"))
                        continue;
                    else
                        cells.Add($"{row},{column}");
                    float[] data = new float[size];
                    var dataArr = band.ReadRaster(row, column, 1, 1, data, 1, 1, 0, 0);
                    var p =listRout[i].Path[j];
                    p.Value = data[0];
                    rout.Path.Add(p);
                }

            }

            return pollution;
        }

        public List<Output> CalculatePollution(string routType, List<Rout> listRout)
        {
            List<Output> listOutput = new List<Output>();
            for (int i = 0; i < listRout.Count; i++)
            {
                double pollutionValue = 0;
                double meanPixleValue = 0;
                double MaxValue = 0;
                Output output = new Output();
                PointModel point = new PointModel();
                for (int j = 0; j < listRout[i].Path.Count; j++)
                {
                    double pollutionPixel = 0;
                    if (routType == "WALKING")
                    {
                        pollutionPixel = (listRout[i].Path[j].Value / 0.89) * 2 * 0.000001 * 70 / 60;

                    }
                    else if (routType == "BICYCLING")
                    {
                        pollutionPixel = (listRout[i].Path[j].Value / 4.47) * 4 * 0.000001 * 70 / 60;
                    }
                    pollutionValue += pollutionPixel;
                    meanPixleValue +=listRout[i].Path[j].Value;
                    if (MaxValue <= pollutionPixel)
                    {
                        MaxValue = pollutionPixel;
                        point.Value = listRout[i].Path[j].Value;
                        point.X = listRout[i].Path[j].X;
                        point.Y = listRout[i].Path[j].Y;
                    }


                    if (routType == "DRIVING")
                    {

                    }
                    if (routType == "TRANSIT")
                    {

                    }

                }
                output.Id=listRout[i].Id;
                output.Distance = listRout[i].Distance;
                output.Duration = listRout[i].Duration;
                output.Pollution = pollutionValue;
                output.MeanPollution = meanPixleValue / listRout[i].Path.Count;
                output.MaxPollution = point;
                listOutput.Add(output);
            }

            return listOutput;
        }

        public JsonResult GetInfo()
        {
            var path = Server.MapPath("~/GeoTiff");
            var fileAdress = $"{path}/Crop123.tif";

            dynamic res = new ExpandoObject();

            Dataset dataset = Gdal.Open(fileAdress, Access.GA_ReadOnly);

            res.description = dataset.GetDescription();
            //res.projection = dataset.GetProjection();
            res.rasterCount = dataset.RasterCount;
            res.xSize = dataset.RasterXSize;
            res.ySize = dataset.RasterYSize;

            Band band = dataset.GetRasterBand(1);
            int width = band.XSize;
            int height = band.YSize;
            int size = width * height;
            double min = 0.00;
            double max = 0.00;
            double mean = 0.00;
            double stddev = 0.00;
            double noData = 0.00;
            int hasNodata = 0;

            band.GetNoDataValue(out noData, out hasNodata);
            res.noData = noData;
            res.hasNodata = hasNodata;
            var stat = band.GetStatistics(1, 0, out min, out max, out mean, out stddev);
            res.min = min;
            res.max = max;
            res.mean = mean;
            res.stddev = stddev;

            DataType type = band.DataType;

            res.type = type;


            float gtMean = 0; //cut
            float ltMean = 0; //fill

            float[] data = new float[size];

            var dataArr = band.ReadRaster(0, 0, width, height, data, width, height, 0, 0);

            float fMean = (float)mean;
            float fNoData = (float)noData;
            int i, j;

            List<string> values = new List<string>();

            for (j = 0; j < height; j++)
            {
                for (i = 0; i < width; i++)
                {
                    float value = data[i + j * width];

                    values.Add($"{i}\t{j}\t{value}");
                    if (value != fNoData)
                    {
                        if (value > fMean)
                        {
                            gtMean += value;
                        }

                        else if (value < fMean)
                        {
                            ltMean += value;
                        }
                    }

                }
            }

            res.gtMean = gtMean;
            res.ltMean = ltMean;
            res.values = values;

            float[] data2 = new float[size];
            dataArr = band.ReadRaster(2, 4, 1, 1, data2, 1, 1, 0, 0);
            res.test = data2[0];

            return Json(res, JsonRequestBehavior.AllowGet);
        }
    }
}


