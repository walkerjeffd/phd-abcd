define([
  'underscore',
  'd3'
], function (_, d3) {
  var SimModel = function() {
    'use strict';

    // private variables
    var output = [];

    // private functions
    var computeSolar = function(latitude, Jday) {
      // section 4.4.2 of Handbook of Hydrology, Maidment
      // good for latitudes of -55 to +55
      var latitudeRadians = latitude/180*Math.PI,
          r = 1 + 0.033*Math.cos(2*Math.PI*Jday/365),
          delta = 0.4093*Math.sin((2*Math.PI*Jday/365) - 1.405),
          omega = Math.acos(-Math.tan(latitudeRadians)*Math.tan(delta)),
          daylight = 24*omega/Math.PI,
          S0_mm = 15.392*r*(Math.sin(latitudeRadians)*omega*Math.sin(delta) + Math.cos(latitudeRadians)*Math.cos(delta)*Math.sin(omega)),
          S0_in = S0_mm*0.03937;
      
      return S0_in;
    };

    var computePET = function(Solar_in, Trng_degC, Tavg_degC) {
      return Trng_degC > 0 ? 0.0023*Solar_in*(Tavg_degC+17.8)*Math.sqrt(Trng_degC) : 0;
    };


    // public function
    var setInput = function(input, latitude) {
      console.log('SimModel: set input');
      output.length = 0;
      
      // copy input to output, compute derived, and add placeholders for others
      for (var i = 0, len = input.length; i < len; i++) {
        var d = {};

        // copy values
        d.Date = input[i].Date;
        d.Tmin = input[i].Tmin_degC;
        d.Tmax = input[i].Tmax_degC;
        d.P = input[i].Precip_in;
        d.obsQ = input[i].Flow_in;

        // compute derived
        d.Jday = d3.time.dayOfYear(input[i].Date) + 1;
        d.Trng = input[i].Tmax_degC - input[i].Tmin_degC;
        d.Tavg = (input[i].Tmax_degC + input[i].Tmin_degC)/2;
        d.SR = computeSolar(latitude, d.Jday);
        d.PET = computePET(d.SR, d.Trng, d.Tavg);
        
        d.SF = NaN;
        d.RF = NaN;
        d.W = NaN;
        d.WGW = NaN;
        d.S = NaN;
        d.G = NaN;
        d.Y = NaN;
        d.GR = NaN;
        d.DR = NaN;
        d.dG = NaN;
        d.ET = NaN;
        d.At = NaN;
        d.mt = NaN;
        d.Pe = NaN;
        d.Q = NaN;
        d.resQ = NaN;
        output.push(d);
      }

    };

    var run = function(params) {
      // console.log('SimModel: running');
      var At, mt, Pe, W, Y, S, GR, DR, G, dG, ET, Q, WGW;
      var SF, RF;

      var a = params.get('a'),
          b = params.get('b'),
          c = params.get('c'),
          d = params.get('d'),
          Mf = params.get('Mf'),
          // Tb = params.get('Tb'),
          Tb = 0,
          latitude = params.get('latitude');

      for (var i = 0, len = output.length; i < len; i++) {

        if (i === 0) { 
          // assign initial conditions
          At = params.get('A0');
          S = params.get('S0');
          G = params.get('G0');
        } 

        SF = output[i].Tavg > Tb ? 0 : output[i].P;
        RF = output[i].P - SF;

        mt = output[i].Tavg > Tb ? Math.min(At, Mf*(output[i].Tavg - Tb)) : 0;
        At = Math.max(At - mt + SF, 0);
        Pe = RF + mt;

        W = S + Pe;
        Y = (W + b)/(2 * a) - Math.sqrt(Math.pow((W + b)/(2 * a),2) - (W * b / a));
        S = Y * Math.exp(-output[i].PET / b);
        GR = c * (W - Y);
        DR = (1 - c) * (W - Y);

        WGW = GR + G; // available groundwater
        G = (GR + G)/(1 + d);
        dG = d * G;
        ET = Y - S;
        Q = Math.max(DR + dG, 0.001);

        output[i].W = W;
        output[i].S = S;
        output[i].WGW = WGW;
        output[i].G = G;
        output[i].Y = Y;
        output[i].GR = GR;
        output[i].DR = DR;
        output[i].dG = dG;
        output[i].ET = ET;
        output[i].At = At;
        output[i].mt = mt;
        output[i].Pe = Pe;
        output[i].Q = Q;
        output[i].SF = SF;
        output[i].RF = RF;
        output[i].resQ = output[i].obsQ - Q;
      }
    };
    
    return {
      run: run,
      getOutput: function() { return output; },
      output: output,
      setInput: setInput
    };
  };

  return SimModel;
});
