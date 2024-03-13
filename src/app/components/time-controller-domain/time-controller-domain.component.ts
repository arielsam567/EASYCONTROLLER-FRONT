import { HttpClient } from '@angular/common/http';
import {
  Component,
  HostListener,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { Matriz } from './Matriz';
import { TimeControllerDomainService } from './time-controller-domain.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  templateUrl: './time-controller-domain.component.html',
  styleUrls: ['./time-controller-domain.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class TimeControllerDomainComponent implements OnInit {
  isLargeScreen = window.innerWidth >= 768;
  imageControl: string = 'assets/png/LQR.png';

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.isLargeScreen = window.innerWidth >= 768;
  }

  public isExpanded = true;

  public toggleMenu() {
    this.isExpanded = !this.isExpanded;
  }
  Nstates: number = 1;
  quadN: number = 1;
  inL: number = 1;
  outM: number = 1;
  matrizes: Matriz[] = [new Matriz('A'), new Matriz('B'), new Matriz('C')];
  matriz_custo: Matriz[] = [new Matriz('Q'), new Matriz('R')];
  matriz_kalman: Matriz[] = [new Matriz('QN'), new Matriz('RN')];
  initialCond: Matriz[] = [new Matriz('CI')];
  graphData: object[] = [];
  graph = {
    data: this.graphData,
    layout: this.layout_title(''),
  };
  graphCI = { data: this.graphData, layout: this.layout_CI() };
  control_rank: string = '';
  obsv_rank: string = '';

  control_rankShow: string = '';
  obsv_rankShow: string = '';
  vY: any = [];
  yLQR: any = [];
  yLQI: any = [];
  yLQG: any = [];
  yLQGI: any = [];
  y_lqr: any = [];
  y_lqi: any = [];
  y_lqg: any = [];
  y_lqgi: any = [];
  y_enc: any = [];
  u_enc: any = [];
  uLQR: any = [];
  uLQI: any = [];
  uLQG: any = [];
  uLQGI: any = [];
  u_lqr: any = [];
  u_lqi: any = [];
  u_lqg: any = [];
  u_lqgi: any = [];
  stepMA: any = [];
  panelMA: boolean = false;
  panelCostMatrixLQR: boolean = false;
  panelCostMatrixLQI: boolean = false;
  panelCostMatrixLQG: boolean = false;
  panelCostMatrixLQGI: boolean = false;
  panelCalc_lqr: boolean = false;
  panelCalc_lqi: boolean = false;
  panelCalc_lqg: boolean = false;
  panelCalc_lqgi: boolean = false;
  lineNameIndex: number = 0;
  codes: any = {};
  Nx: number = 0;
  Ny: number = 0;
  Nu: number = 0;
  T: number = 0;
  K: any = [];
  Ki: any = [];
  L: any = [];
  panelState: boolean = false;

  constructor(
    private timeControllerDomainService: TimeControllerDomainService,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.createTables();
  }

  ngOnInit(): void {
    // console.log('Loading app - time-controller-domain');
  }

  showCode() {
    this.panelState = !this.panelState;
  }

  createTables() {
    if (this.quadN < 1) {
      this.quadN = 1;
    }
    if (this.inL < 1) {
      this.inL = 1;
    }
    if (this.outM < 1) {
      this.outM = 1;
    }

    for (let i = 0; i < this.matrizes.length; i++) {
      const matriz = this.matrizes[i];
      if (matriz.label === 'A') {
        matriz.lines = this.quadN;
        matriz.cols = this.quadN;
      }
      if (matriz.label === 'B') {
        matriz.lines = this.quadN;
        matriz.cols = this.inL;
      }
      if (matriz.label === 'C') {
        matriz.lines = this.outM;
        matriz.cols = this.quadN;
      }
      // if (matriz.label === 'D') {
      // matriz.lines = this.inL;
      // matriz.cols = this.inL;
      // }
      matriz.values = Array.from(
        Array(matriz.lines),
        () => new Array(matriz.cols)
      );
      for (let i = 0; i < matriz.lines; i++) {
        for (let j = 0; j < matriz.cols; j++) {
          matriz.values[i][j] = 0;
        }
      }
      // console.log('matriz.values', matriz.values);
    }
  }

  matrizValueChange(matryz: any, line: any, col: any, event: any) {
    matryz.values[line][col] = event.target.value;
  }

  trackByFilter(index: number, item: any): number {
    return item.id;
  }

  calc_lqr() {
    this.panelCalc_lqr = true;
    this.panelCalc_lqi = false;
    this.panelCalc_lqg = false;
    this.panelCalc_lqgi = false;
    const matriz_custo_lqr = {
      A: this.matrizes[0].values,
      B: this.matrizes[1].values,
      C: this.matrizes[2].values,

      Q: this.matriz_custo[0].values,
      R: this.matriz_custo[1].values,
      CI: this.initialCond[0].values,
    };

    this.timeControllerDomainService.calc_lqr(matriz_custo_lqr).then((data) => {
      //console.log(data);

      // @ts-ignore
      this.Nx = JSON.parse(data['Nx']);
      // @ts-ignore
      this.Ny = JSON.parse(data['Ny']);
      // @ts-ignore
      this.Nu = JSON.parse(data['Nu']);
      // @ts-ignore
      this.T = JSON.parse(data['T']);
      // @ts-ignore
      this.K = JSON.parse(data['K']);

      this.yLQR = [];
      this.uLQR = [];
      // @ts-ignore
      this.u_enc = data['Uhat'];
      this.u_lqr = JSON.parse(this.u_enc);
      // @ts-ignore
      this.y_enc = data['Yout'];
      this.y_lqr = JSON.parse(this.y_enc);
      // @ts-ignore
      const vTime = data['time'];
      var dataUlqr = [];

      for (let i = 0; i < this.u_lqr.length; i++) {
        var datatmpUlqr = {
          x: vTime,
          y: this.u_lqr[i],
          mode: 'lines',
          type: 'scatter',
          connectgaps: true,
          name: `u${i + 1}`,
        };
        dataUlqr.push(datatmpUlqr);
      }

      this.graphCI = {
        data: dataUlqr,
        layout: this.layout_CI(),
      };
      this.uLQR.push(this.graphCI.data);

      var dataYlqr = [];

      for (let i = 0; i < this.y_lqr.length; i++) {
        var datatmpYlqr = {
          x: vTime,
          y: this.y_lqr[i],
          mode: 'lines',
          type: 'scatter',
          connectgaps: true,
          name: `y${i + 1}`,
        };
        dataYlqr.push(datatmpYlqr);
      }

      this.graphCI = {
        data: dataYlqr,
        layout: this.layout_CI(),
      };
      this.yLQR.push(this.graphCI.data);
      this.codes.lqr = this.getCodeLQR(matriz_custo_lqr, data);
    });
  }

  calc_lqi() {
    this.panelCalc_lqi = true;
    this.panelCalc_lqr = false;
    this.panelCalc_lqg = false;
    this.panelCalc_lqgi = false;
    const matriz_custo_lqi = {
      A: this.matrizes[0].values,
      B: this.matrizes[1].values,
      C: this.matrizes[2].values,
      Q: this.matriz_custo[0].values,
      R: this.matriz_custo[1].values,
      CI: this.initialCond[0].values,
    };

    this.timeControllerDomainService.calc_lqi(matriz_custo_lqi).then((data) => {
      // @ts-ignore
      this.Nx = JSON.parse(data['Nx']);
      // @ts-ignore
      this.Ny = JSON.parse(data['Ny']);
      // @ts-ignore
      this.Nu = JSON.parse(data['Nu']);
      // @ts-ignore
      this.T = JSON.parse(data['T']);
      // @ts-ignore
      this.K = JSON.parse(data['K']);
      // @ts-ignore
      this.Ki = JSON.parse(data['Ki']);

      this.yLQI = [];
      this.uLQI = [];
      // @ts-ignore
      this.u_enc = data['Uhat'];
      this.u_lqi = JSON.parse(this.u_enc);
      // @ts-ignore
      this.y_enc = data['Yout'];
      this.y_lqi = JSON.parse(this.y_enc);
      // @ts-ignore
      const vTime = data['time'];
      var dataUlqi = [];

      for (let i = 0; i < this.u_lqi.length; i++) {
        var datatmpUlqi = {
          x: vTime,
          y: this.u_lqi[i],
          mode: 'lines',
          type: 'scatter',
          connectgaps: true,
          name: `u${i + 1}`,
        };
        dataUlqi.push(datatmpUlqi);
      }

      this.graphCI = {
        data: dataUlqi,
        layout: this.layoutInt(),
      };
      this.uLQI.push(this.graphCI.data);

      var dataYlqi = [];
      for (let i = 0; i < this.y_lqi.length; i++) {
        var datatmpYlqi = {
          x: vTime,
          y: this.y_lqi[i],
          mode: 'lines',
          type: 'scatter',
          connectgaps: true,
          name: `y${i + 1}`,
        };
        dataYlqi.push(datatmpYlqi);
      }

      this.graphCI = {
        data: dataYlqi,
        layout: this.layoutInt(),
      };
      this.yLQI.push(this.graphCI.data);
      this.codes.lqi = this.getCodeLQI(matriz_custo_lqi, data);
    });
  }

  calc_lqg() {
    this.panelCalc_lqg = true;
    this.panelCalc_lqr = false;
    this.panelCalc_lqi = false;
    this.panelCalc_lqgi = false;
    const matriz_custo_lqg = {
      A: this.matrizes[0].values,
      B: this.matrizes[1].values,
      C: this.matrizes[2].values,
      CI: this.initialCond[0].values,
      Q: this.matriz_custo[0].values,
      R: this.matriz_custo[1].values,
      QN: this.matriz_kalman[0].values,
      RN: this.matriz_kalman[1].values,
    };

    this.timeControllerDomainService.calc_lqg(matriz_custo_lqg).then((data) => {
      // @ts-ignore
      this.Nx = JSON.parse(data['Nx']);
      // @ts-ignore
      this.Ny = JSON.parse(data['Ny']);
      // @ts-ignore
      this.Nu = JSON.parse(data['Nu']);
      // @ts-ignore
      this.T = JSON.parse(data['T']);
      // @ts-ignore
      this.K = JSON.parse(data['K']);
      // @ts-ignore
      this.L = JSON.parse(data['L']);

      this.yLQG = [];
      this.uLQG = [];
      // @ts-ignore
      this.u_enc = data['Uhat'];
      this.u_lqg = JSON.parse(this.u_enc);

      // @ts-ignore
      this.y_enc = data['Yout'];
      this.y_lqg = JSON.parse(this.y_enc);
      // @ts-ignore
      const vTime = data['time'];

      var dataYlqg = [];
      for (let i = 0; i < this.y_lqg.length; i++) {
        var datatmpYlqg = {
          x: vTime,
          y: this.y_lqg[i],
          mode: 'lines',
          type: 'scatter',
          connectgaps: true,
          name: `y${i + 1}`,
        };
        dataYlqg.push(datatmpYlqg);
      }

      this.graphCI = {
        data: dataYlqg,
        layout: this.layout_CI(),
      };
      this.yLQG.push(this.graphCI.data);

      var dataUlqg = [];
      for (let i = 0; i < this.u_lqg.length; i++) {
        var datatmpUlqg = {
          x: vTime,
          y: this.u_lqg[i],
          mode: 'lines',
          type: 'scatter',
          connectgaps: true,
          name: `u${i + 1}`,
        };
        dataUlqg.push(datatmpUlqg);
      }

      this.graphCI = {
        data: dataUlqg,
        layout: this.layout_CI(),
      };
      this.uLQG.push(this.graphCI.data);
      this.codes.lqg = this.getCodeLQG(matriz_custo_lqg, data);
    });
  }

  calc_lqgi() {
    this.panelCalc_lqgi = true;
    this.panelCalc_lqr = false;
    this.panelCalc_lqi = false;
    this.panelCalc_lqg = false;
    const matriz_custo_lqgi = {
      A: this.matrizes[0].values,
      B: this.matrizes[1].values,
      C: this.matrizes[2].values,
      // D: this.matrizes[3].values,
      CI: this.initialCond[0].values,
      Q: this.matriz_custo[0].values,
      R: this.matriz_custo[1].values,
      QN: this.matriz_kalman[0].values,
      RN: this.matriz_kalman[1].values,
    };

    this.timeControllerDomainService.calc_lqgi(matriz_custo_lqgi).then(
      (data) => {
        // @ts-ignore
        this.Nx = JSON.parse(data['Nx']);
        // @ts-ignore
        this.Ny = JSON.parse(data['Ny']);
        // @ts-ignore
        this.Nu = JSON.parse(data['Nu']);
        // @ts-ignore
        this.T = JSON.parse(data['T']);
        // @ts-ignore
        this.K = JSON.parse(data['K']);
        // @ts-ignore
        this.Ki = JSON.parse(data['Ki']);
        // @ts-ignore
        this.L = JSON.parse(data['L']);

        this.yLQGI = [];
        this.uLQGI = [];
        // @ts-ignore
        this.u_enc = data['Uhat'];
        this.u_lqgi = JSON.parse(this.u_enc);

        // @ts-ignore
        this.y_enc = data['Yout'];
        this.y_lqgi = JSON.parse(this.y_enc);
        // @ts-ignore
        const vTime = data['time'];

        var dataYlqgi = [];
        for (let i = 0; i < this.y_lqgi.length; i++) {
          var datatmpYlqgi = {
            x: vTime,
            y: this.y_lqgi[i],
            mode: 'lines',
            type: 'scatter',
            connectgaps: true,
            name: `y${i + 1}`,
          };
          dataYlqgi.push(datatmpYlqgi);
        }

        this.graphCI = {
          data: dataYlqgi,
          layout: this.layoutInt(),
        };
        this.yLQGI.push(this.graphCI.data);

        var dataUlqgi = [];
        for (let i = 0; i < this.u_lqgi.length; i++) {
          var datatmpUlqgi = {
            x: vTime,
            y: this.u_lqgi[i],
            mode: 'lines',
            type: 'scatter',
            connectgaps: true,
            name: `u${i + 1}`,
          };
          dataUlqgi.push(datatmpUlqgi);
        }

        this.graphCI = {
          data: dataUlqgi,
          layout: this.layoutInt(),
        };
        this.uLQGI.push(this.graphCI.data);
        this.codes.lqgi = this.getCodeLQGI(matriz_custo_lqgi, data);
      },
      (err) => {
        this.showMessageError(
          'Algoritmo não converge. Resintonizar as matrizes Q e/ou R!'
        );
      }
    );
  }

  calcularDinamicaDaPlanta() {
    this.panelMA = true;
    this.panelCalc_lqr = false;
    this.panelCalc_lqi = false;
    this.panelCalc_lqg = false;
    this.panelCalc_lqgi = false;
    this.panelState = false;
    this.panelCostMatrixLQR = false;
    this.panelCostMatrixLQI = false;
    this.panelCostMatrixLQG = false;
    this.panelCostMatrixLQGI = false;

    const input = {
      A: this.matrizes[0].values,
      B: this.matrizes[1].values,
      C: this.matrizes[2].values,
    };

    this.timeControllerDomainService
      .calcStep(input)
      .then((data) => {
        // @ts-ignore
        this.control_rank = data['control_rank'];

        if (!this.isControlable()) {
          this.showMessageError(
            'O sistema não é controlaver, Favor alterar matriz de entradas (B)'
          );
        }
        // @ts-ignore
        this.obsv_rank = data['obsv_rank'];
        if (!this.isOberservable()) {
          this.showMessageError(
            'O sistema não é observavel, Favor alterar matriz de entradas (C)'
          );
        } else {
          this.costMatrixLqr();
        }
        this.stepMA = [];
        // @ts-ignore
        this.vY = data['outY_total'];
        // @ts-ignore
        const vTime = data['time'];

        var datas = [];
        this.lineNameIndex = 0;
        let outIndex = 0;
        for (let i = 0; i < this.vY.length; i++) {
          var datatmp = {
            x: vTime,
            y: this.vY[i],
            mode: 'lines',
            type: 'scatter',
            connectgaps: true,
            name: this.getLineName(i + 1, outIndex),
          };
          datas.push(datatmp);
          if (this.lineNameIndex == this.outM) {
            this.lineNameIndex = 0;
            if (this.outM > this.inL) {
              outIndex += this.outM - this.inL;
            }
            if (this.outM == 1) {
              outIndex = 0;
            } else {
              outIndex++;
            }
          }
        }

        this.graph = {
          data: datas,
          layout: this.layout_title('Resposta ao degrau unitário'),
        };
        this.stepMA.push(this.graph.data);
      })
      .catch((err) => {
        this.showMessageError('Ocorreu um erro, sistema não calculavel');
      });
  }

  getLineName(index: number, outIndex: number) {
    return `De u${index - this.lineNameIndex - outIndex} para y${++this
      .lineNameIndex}`;
  }

  layoutInt() {
    return this.layout_title('Resposta à referência tipo degrau unitário');
  }

  selectValueChanged(event: any) {
    const selectedValue = event.target.value;
    if (selectedValue === 'LQR') {
      this.imageControl = 'assets/png/LQR.png';
      this.costMatrixLqr();
    } else if (selectedValue === 'LQR_Integrador') {
      this.imageControl = 'assets/png/LQRI.png';
      this.costMatrixLqi();
    } else if (selectedValue === 'LQG' && this.isOberservable()) {
      this.imageControl = 'assets/png/LQG.png';
      this.costMatrixLqg();
    } else if (selectedValue === 'LQG_Integrador' && this.isOberservable()) {
      this.imageControl = 'assets/png/LQGI.png';
      this.costMatrixLqgi();
    }
  }

  layout_title(title: string) {
    return {
      title: title,
      titlefont: {
        family: 'Arial, sans-serif',
        size: 16,
        color: 'black',
      },
      xaxis: {
        title: 'Tempo',
        titlefont: {
          family: 'Arial, sans-serif',
          size: 15,
          color: 'black',
        },
        showticklabels: true,
        tickangle: 'auto',
        tickfont: {
          family: 'Arial, sans-serif',
          size: 12,
          color: 'black',
        },
      },
      yaxis: {
        title: 'Amplitude',
        titlefont: {
          family: 'Arial, sans-serif',
          size: 15,
          color: 'black',
        },
        showticklabels: true,
        tickangle: 0,
        tickfont: {
          family: 'Arial, sans-serif',
          size: 12,
          color: 'black',
        },
        exponentformat: 'e',
        showexponent: 'all',
      },
    };
  }

  layout_CI() {
    return this.layout_title_CI('Resposta à condição inicial');
  }

  layout_title_CI(title: string) {
    return {
      title: title,
      titlefont: {
        family: 'Arial, sans-serif',
        size: 16,
        color: 'black',
      },
      xaxis: {
        title: 'Tempo',
        titlefont: {
          family: 'Arial, sans-serif',
          size: 15,
          color: 'black',
        },
        showticklabels: true,
        tickangle: 'auto',
        tickfont: {
          family: 'Old Standard TT, serif',
          size: 15,
          color: 'black',
        },
      },
      yaxis: {
        title: 'Amplitude',
        titlefont: {
          family: 'Arial, sans-serif',
          size: 15,
          color: 'black',
        },
        showticklabels: true,
        tickangle: 0,
        tickfont: {
          family: 'Old Standard TT, serif',
          size: 12,
          color: 'black',
        },
        exponentformat: 'e',
        showexponent: 'all',
      },
    };
  }

  costMatrixLqr() {
    this.panelCostMatrixLQR = true;
    this.panelCostMatrixLQI = false;
    this.panelCostMatrixLQG = false;
    this.panelCostMatrixLQGI = false;
    this.panelState = false;

    for (let i = 0; i < this.initialCond.length; i++) {
      const CI = this.initialCond[i];
      if (CI.label === 'CI') {
        CI.lines = 1;
        CI.cols = this.quadN;
      }
      for (let i = 0; i < CI.lines; i++) {
        for (let j = 0; j < CI.cols; j++) {
          CI.values[i][j] = 0;
        }
      }
    }
    for (let i = 0; i < this.matriz_custo.length; i++) {
      const myLQR = this.matriz_custo[i];
      if (myLQR.label === 'CI') {
        myLQR.lines = 1;
        myLQR.cols = this.quadN;
      }
      if (myLQR.label === 'Q') {
        myLQR.lines = this.matrizes[0].lines;
        myLQR.cols = this.matrizes[0].lines;
      }
      if (myLQR.label === 'R') {
        myLQR.lines = this.inL;
        myLQR.cols = this.inL;
      }
      myLQR.values = Array.from(
        Array(myLQR.lines),
        () => new Array(myLQR.cols)
      );
      for (let i = 0; i < myLQR.lines; i++) {
        for (let j = 0; j < myLQR.cols; j++) {
          myLQR.values[i][j] = 0;
        }
      }
    }
  }

  costMatrixLqi() {
    this.panelCostMatrixLQI = true;
    this.panelCostMatrixLQR = false;
    this.panelCostMatrixLQG = false;
    this.panelCostMatrixLQGI = false;
    this.panelState = false;

    for (let i = 0; i < this.matriz_custo.length; i++) {
      const myLQI = this.matriz_custo[i];
      if (myLQI.label === 'Q') {
        if (this.inL === this.outM) {
          myLQI.lines = this.quadN + this.inL;
          myLQI.cols = this.quadN + this.inL;
        } else if (this.inL < this.outM) {
          myLQI.lines = this.quadN + this.outM;
          myLQI.cols = this.quadN + this.outM;
        } else {
          myLQI.lines = this.quadN + 1;
          myLQI.cols = this.quadN + 1;
        }
      }
      if (myLQI.label === 'R') {
        myLQI.lines = this.inL;
        myLQI.cols = this.inL;
      }
      myLQI.values = Array.from(
        Array(myLQI.lines),
        () => new Array(myLQI.cols)
      );
      for (let i = 0; i < myLQI.lines; i++) {
        for (let j = 0; j < myLQI.cols; j++) {
          myLQI.values[i][j] = 0;
        }
      }
    }
  }

  costMatrixLqg() {
    this.panelCostMatrixLQG = true;
    this.panelCostMatrixLQR = false;
    this.panelCostMatrixLQI = false;
    this.panelCostMatrixLQGI = false;
    this.panelState = false;
    for (let i = 0; i < this.initialCond.length; i++) {
      const CI = this.initialCond[i];
      if (CI.label === 'CI') {
        CI.lines = 1;
        CI.cols = this.quadN;
      }
      for (let i = 0; i < CI.lines; i++) {
        for (let j = 0; j < CI.cols; j++) {
          CI.values[i][j] = 0;
        }
      }
    }
    for (let i = 0; i < this.matriz_custo.length; i++) {
      const myLQG = this.matriz_custo[i];
      if (myLQG.label === 'Q') {
        myLQG.lines = this.quadN;
        myLQG.cols = this.quadN;
      }
      if (myLQG.label === 'R') {
        myLQG.lines = this.inL;
        myLQG.cols = this.inL;
      }
      myLQG.values = Array.from(
        Array(myLQG.lines),
        () => new Array(myLQG.cols)
      );
      for (let i = 0; i < myLQG.lines; i++) {
        for (let j = 0; j < myLQG.cols; j++) {
          myLQG.values[i][j] = 0;
        }
      }
    }

    for (let i = 0; i < this.matriz_kalman.length; i++) {
      const myKalman = this.matriz_kalman[i];
      if (myKalman.label === 'QN') {
        myKalman.lines = this.inL;
        myKalman.cols = this.inL;
      }
      if (myKalman.label === 'RN') {
        myKalman.lines = this.outM;
        myKalman.cols = this.outM;
      }
      myKalman.values = Array.from(
        Array(myKalman.lines),
        () => new Array(myKalman.cols)
      );
      for (let i = 0; i < myKalman.lines; i++) {
        for (let j = 0; j < myKalman.cols; j++) {
          myKalman.values[i][j] = 0;
        }
      }
    }
  }

  costMatrixLqgi() {
    this.panelCostMatrixLQGI = true;
    this.panelCostMatrixLQR = false;
    this.panelCostMatrixLQI = false;
    this.panelCostMatrixLQG = false;
    this.panelState = false;
    for (let i = 0; i < this.matriz_custo.length; i++) {
      const myLQGI = this.matriz_custo[i];
      if (myLQGI.label === 'Q') {
        if (this.inL === this.outM) {
          myLQGI.lines = this.quadN + this.inL;
          myLQGI.cols = this.quadN + this.inL;
        } else if (this.inL < this.outM) {
          myLQGI.lines = this.quadN + this.outM;
          myLQGI.cols = this.quadN + this.outM;
        } else {
          // (this.inL === 1 && this.outM === 1){
          myLQGI.lines = this.quadN + 1;
          myLQGI.cols = this.quadN + 1;
        }
      }
      if (myLQGI.label === 'R') {
        myLQGI.lines = this.inL;
        myLQGI.cols = this.inL;
      }
      myLQGI.values = Array.from(
        Array(myLQGI.lines),
        () => new Array(myLQGI.cols)
      );
      for (let i = 0; i < myLQGI.lines; i++) {
        for (let j = 0; j < myLQGI.cols; j++) {
          myLQGI.values[i][j] = 0;
        }
      }
    }

    for (let i = 0; i < this.matriz_kalman.length; i++) {
      const myKalman = this.matriz_kalman[i];
      if (myKalman.label === 'QN') {
        myKalman.lines = this.inL;
        myKalman.cols = this.inL;
      }
      if (myKalman.label === 'RN') {
        myKalman.lines = this.outM;
        myKalman.cols = this.outM;
      }
      myKalman.values = Array.from(
        Array(myKalman.lines),
        () => new Array(myKalman.cols)
      );
      for (let i = 0; i < myKalman.lines; i++) {
        for (let j = 0; j < myKalman.cols; j++) {
          myKalman.values[i][j] = 0;
        }
      }
    }
  }

  codeCopied() {
    this.showMessageSuccess('Código copiado para a área de transferência');
  }

  handleEnterKey(event: KeyboardEvent, i: number, j: number) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Evita o comportamento padrão de quebra de linha do Enter
      const id = `cell_${i}_${j}`;
      const formElements = document.querySelectorAll('.inputMatriz');
      const formElementsArray = Array.from(formElements);

      const currentIndex = formElementsArray.findIndex(
        (element) => element.id === id && element.attributes[8].value === ''
      );
      const nextIndex = currentIndex + 1;
      const nextElement = formElements[nextIndex] as HTMLElement;
      if (nextElement) {
        nextElement.focus();
      }
    }
  }

  limparInput() {
    const formElements = document.querySelectorAll('.inputMatriz');
    formElements.forEach((element) => {
      if (element instanceof HTMLInputElement) {
        element.value = '';
      }
    });
  }

  isOberservable() {
    const value = this.obsv_rank === 'O sistema é observável';
    if (value) {
      this.obsv_rankShow = 'Teste de Observabilidade ✅';
    } else {
      this.obsv_rankShow = 'Teste de Observabilidade ❌';
    }
    return value;
  }

  isControlable() {
    const value = this.control_rank === 'O sistema é controlável';
    if (value) {
      this.control_rankShow = 'Teste de Controlabilidade ✅';
    } else {
      this.control_rankShow = 'Teste de Controlabilidade ❌';
    }

    return value;
  }

  getCodeLQR(matriz_custo_lqr: any, data: Object) {
    return `
// *********************************************** //
//   Código gerado por EasyController for Arduino  //
//              www.easycontroller.com             //
// Usar com Arduinos baseados em processadores AVR //
// *********************************************** //

//---LQR---

#include <TimerOne.h>
#include <BasicLinearAlgebra.h>

using namespace BLA;


// Declaração das variáveis de leitura
#define Nx ${this.Nx}        // Ordem da planta
#define Nu ${this.Nu}        // Número de sinais de controle
#define T  ${this.T}         // Período de amostragem [s]

// Inicialização dos vetores e matrizes
  // Matriz de ganhos (modificar aqui)
    BLA::Matrix<Nu, Nx> K = {${this.K}};
  // Vetor de estados (modificar condições inicias, se necessário)
    BLA::Matrix<Nx> x = {${matriz_custo_lqr.CI}};
  // Vetor de sinais de controle
    BLA::Matrix<Nu> u;
  // Vetor de PWM dos sinais de controle
    BLA::Matrix<Nu> u_pwm;
  // Saturação superior do sinal de controle (modificar aqui)
    BLA::Matrix<Nu> lim_sup = {1 , 1};
  // Saturação inferior do sinal de controle (modificar aqui)
    BLA::Matrix<Nu> lim_inf = {0 , 0};
  // Valor máximo do PWM (modificar aqui)
    BLA::Matrix<Nu> maxPWM = {255 , 255};
  // Valor mínimo do PWM (modificar aqui)
    BLA::Matrix<Nu> minPWM = {0 , 0};
  // Pinos de saída PWM (modificar aqui)
    BLA::Matrix<Nu> PWM_pins = {5 , 6};


// Inicializações de programa
int i=0, j=0, k=0;


double mapf(double val,double in_min,double in_max,double out_min,double out_max) {
  return (val-in_min)*(out_max-out_min)/(in_max-in_min)+out_min;
}

// Setup
void setup()
{
  Timer1.initialize(1000000*T);      // Inicializa Timer1 com período de amostragem (em us)
  Timer1.attachInterrupt(controle);  // Define a interrupção de tempo
}


// Interrupção de tempo
void controle() {

  u = -K * x;

  // Calcula os sinais de controle saturados
  for (i = 0; i < Nu; i++) {
    if (u(i) > lim_sup(i)){
      u(i) = lim_sup(i);
    } else if (u(i) < lim_inf(i)) {
      u(i) = lim_inf(i);
    }
  }
}


void loop() {

  // Escrever aqui as leituras, conversões de sinal, etc.
  x(0) = analogRead(A0)*5/1023 -2;
  x(1) = analogRead(A1)*16/1023 -8;
  //x(2) = ...


  // Mapeamento (float) dos sinais de controle para as saídas PWM
  for (j = 0; j < Nu; j++) {
    u_pwm(j) = mapf(u(j),lim_inf(j),lim_sup(j),minPWM(j),maxPWM(j));
  }

  // Atualizaçãod dos PWM
  for (k = 0; k < Nu; k++) {
    analogWrite(PWM_pins(k),u_pwm(k));
  }
  `;
  }

  getCodeLQI(matriz_custo_lqi: any, data: Object) {
    return `
// *********************************************** //
//   Código gerado por EasyController for Arduino  //
//              www.easycontroller.com             //
// Usar com Arduinos baseados em processadores AVR //
// *********************************************** //

//---LQR + integrador---

#include <TimerOne.h>
#include <BasicLinearAlgebra.h>

using namespace BLA;


// Declaração das variáveis de leitura
#define Nx ${this.Nx}        // Ordem da planta
#define Nu ${this.Nu}        // Número de sinais de controle
#define Ny ${this.Ny}        // Número de saídas
#define T  ${this.T}         // Período de amostragem [s]

// Inicialização dos vetores e matrizes
  // Matriz de saídas;
    BLA::Matrix<Ny, Nx> C = {${matriz_custo_lqi.C}};
  // Matriz de ganhos (modificar aqui)
    BLA::Matrix<Nu, Nx> K = {${this.K}};
    BLA::Matrix<Nu, Nx> Ki = {${this.Ki}};
    // Vetor de estados (modificar condições inicias, se necessário)
    BLA::Matrix<Nx> x = {${matriz_custo_lqi.CI}};
  // Vetor de sinais de controle
    BLA::Matrix<Nu> u;
  // Vetores para o integrador
    BLA::Matrix<Ny> y;
    BLA::Matrix<Ny> Ref;
    BLA::Matrix<Ny> int_e;
    BLA::Matrix<Ny> e;
  // Vetor de PWM dos sinais de controle
    BLA::Matrix<Nu> u_pwm;
  // Saturação superior do sinal de controle (modificar aqui)
    BLA::Matrix<Nu> lim_sup = {1 , 1};
  // Saturação inferior do sinal de controle (modificar aqui)
    BLA::Matrix<Nu> lim_inf = {0 , 0};
  // Valor máximo do PWM (modificar aqui)
    BLA::Matrix<Nu> maxPWM = {255 , 255};
  // Valor mínimo do PWM (modificar aqui)
    BLA::Matrix<Nu> minPWM = {0 , 0};
  // Pinos de saída PWM (modificar aqui)
    BLA::Matrix<Nu> PWM_pins = {5 , 6};


// Inicializações de programa
int i=0, j=0, k=0;


double mapf(double val,double in_min,double in_max,double out_min,double out_max) {
  return (val-in_min)*(out_max-out_min)/(in_max-in_min)+out_min;
}

// Setup
void setup()
{
  Timer1.initialize(1000000*T);      // Inicializa Timer1 com período de amostragem (em us)
  Timer1.attachInterrupt(controle);  // Define a interrupção de tempo
}


// Interrupção de tempo
void controle() {

  y = C * x;
  e = Ref - y;
  int_e = int_e + e * T;
  u = -K * x - Ki * int_e;

  // Calcula os sinais de controle saturados
  for (i = 0; i < Nu; i++) {
    if (u(i) > lim_sup(i)){
      u(i) = lim_sup(i);
    } else if (u(i) < lim_inf(i)) {
      u(i) = lim_inf(i);
    }
  }
}


void loop() {

  // Escrever aqui as leituras, conversões de sinal, etc.
  x(0) = analogRead(A0)*5/1023 -2;
  x(1) = analogRead(A1)*16/1023 -8;
  //x(2) = ...


  // Mapeamento (float) dos sinais de controle para as saídas PWM
  for (j = 0; j < Nu; j++) {
    u_pwm(j) = mapf(u(j),lim_inf(j),lim_sup(j),minPWM(j),maxPWM(j));
  }

  // Atualizaçãod dos PWM
  for (k = 0; k < Nu; k++) {
    analogWrite(PWM_pins(k),u_pwm(k));
  }
  `;
  }

  getCodeLQG(matriz_custo_lqg: any, data: Object) {
    return `
// *********************************************** //
//   Código gerado por EasyController for Arduino  //
//              www.easycontroller.com             //
// Usar com Arduinos baseados em processadores AVR //
// *********************************************** //

//---LQG---

#include <TimerOne.h>
#include <BasicLinearAlgebra.h>

using namespace BLA;


// Declaração das variáveis de leitura
#define Nx ${this.Nx}        // Ordem da planta
#define Nu ${this.Nu}        // Número de sinais de controle
#define Ny ${this.Ny}        // Número de saídas
#define T  ${this.T}     // Período de amostragem [s]

// Inicialização dos vetores e matrizes
  // Matriz de estados
    BLA::Matrix<Nx, Nx> A = {${matriz_custo_lqg.A}};
  // Matrix de entradas
    BLA::Matrix<Nx, Nu> B = {${matriz_custo_lqg.B}};
  // Matrix de saídas
    BLA::Matrix<Ny, Nx> C = {${matriz_custo_lqg.C}};
  // Matriz de ganhos (modificar aqui)
    BLA::Matrix<Nu, Nx> K = {${this.K}};
  // Matrix de ganhos de Kalman
    BLA::Matrix<Nx, Nx> L = {${this.L}};
  // Vetor de estados (modificar condições inicias, se necessário)
    BLA::Matrix<Nx, Nx> x = {${matriz_custo_lqg.CI}};
  // Vetor de sinais de controle
    BLA::Matrix<Nu, Nu> u;
  // Vetor  de saídas
    BLA::Matrix<Ny, Ny> y;
  // Vetor de estados estimados
    BLA::Matrix<Nx, Nx> xhat;
  // Vetor de PWM dos sinais de controle
    BLA::Matrix<Nu> u_pwm;
  // Saturação superior do sinal de controle (modificar aqui)
    BLA::Matrix<Nu> lim_sup = {1 , 1};
  // Saturação inferior do sinal de controle (modificar aqui)
    BLA::Matrix<Nu> lim_inf = {0 , 0};
  // Valor máximo do PWM (modificar aqui)
    BLA::Matrix<Nu> maxPWM = {255 , 255};
  // Valor mínimo do PWM (modificar aqui)
    BLA::Matrix<Nu> minPWM = {0 , 0};
  // Pinos de saída PWM (modificar aqui)
    BLA::Matrix<Nu> PWM_pins = {5 , 6};


// Inicializações de programa
int i=0, j=0, k=0;


double mapf(double val,double in_min,double in_max,double out_min,double out_max) {
  return (val-in_min)*(out_max-out_min)/(in_max-in_min)+out_min;
}

// Setup
void setup()
{
  Timer1.initialize(1000000*T);      // Inicializa Timer1 com período de amostragem (em us)
  Timer1.attachInterrupt(controle);  // Define a interrupção de tempo
}


// Interrupção de tempo
void controle() {

  y = C * x;
  xhat = xhat + ((A - L * C) * xhat + (B * u) + (L * y)) * T;
  u = -K * xhat;

  // Calcula os sinais de controle saturados
  for (i = 0; i < Nu; i++) {
    if (u(i) > lim_sup(i)){
      u(i) = lim_sup(i);
    } else if (u(i) < lim_inf(i)) {
      u(i) = lim_inf(i);
    }
  }
}


void loop() {

  // Escrever aqui as leituras, conversões de sinal, etc.
  x(0) = analogRead(A0)*5/1023 -2;
  x(1) = analogRead(A1)*16/1023 -8;
  //x(2) = ...


  // Mapeamento (float) dos sinais de controle para as saídas PWM
  for (j = 0; j < Nu; j++) {
    u_pwm(j) = mapf(u(j),lim_inf(j),lim_sup(j),minPWM(j),maxPWM(j));
  }

  // Atualizaçãod dos PWM
  for (k = 0; k < Nu; k++) {
    analogWrite(PWM_pins(k),u_pwm(k));
  }
  `;
  }

  getCodeLQGI(matriz_custo_lqgi: any, data: Object) {
    return `

  // *********************************************** //
  //   Código gerado por EasyController for Arduino  //
  //              www.easycontroller.com             //
  // Usar com Arduinos baseados em processadores AVR //
  // *********************************************** //

  //---LQG + integrador---

  #include <TimerOne.h>
  #include <BasicLinearAlgebra.h>

  using namespace BLA;


  // Declaração das variáveis de leitura
  #define Nx ${this.Nx}        // Ordem da planta
  #define Nu ${this.Nu}        // Número de sinais de controle
  #define Ny ${this.Ny}        // Número de saídas
  #define T  ${this.T}         // Período de amostragem [s]

  // Inicialização dos vetores e matrizes
    // Matriz de estados
      BLA::Matrix<Nx, Nx> A = {${matriz_custo_lqgi.A}};
    // Matriz de entradas
      BLA::Matrix<Nx, Nu> B = {${matriz_custo_lqgi.B}};
    // Matriz de saídas
      BLA::Matrix<Ny, Nx> C = {${matriz_custo_lqgi.C}};
    // Matriz de ganhos (modificar aqui)
      BLA::Matrix<Nu, Nx> K = {${this.K}};
    // Matriz de ganhos do integrador
      BLA::Matrix<Nu, Ny> Ki = {${this.Ki}};
    // Matriz de ganhos de Kalman
      BLA::Matrix<Nx, Nx> L = {${this.L}};
    // Vetor de estados (modificar condições inicias, se necessário)
      BLA::Matrix<Nx, Nx> x = {${matriz_custo_lqgi.CI}};
    // Vetor de sinais de controle
      BLA::Matrix<Nu, Nu> u;
    // Vetor  de saídas
      BLA::Matrix<Ny, Ny> y;
    // Vetores para o integrador
      BLA::Matrix<Ny, Ny> Ref;
      BLA::Matrix<Ny, Ny> int_e;
      BLA::Matrix<Ny, Ny> e;
    // Vetor de estados estimados
      BLA::Matrix<Nx, Nx> xhat;
    // Vetor de PWM dos sinais de controle
      BLA::Matrix<Nu> u_pwm;
    // Saturação superior do sinal de controle (modificar aqui)
      BLA::Matrix<Nu> lim_sup = {1 , 1};
    // Saturação inferior do sinal de controle (modificar aqui)
      BLA::Matrix<Nu> lim_inf = {0 , 0};
    // Valor máximo do PWM (modificar aqui)
      BLA::Matrix<Nu> maxPWM = {255 , 255};
    // Valor mínimo do PWM (modificar aqui)
      BLA::Matrix<Nu> minPWM = {0 , 0};
    // Pinos de saída PWM (modificar aqui)
      BLA::Matrix<Nu> PWM_pins = {5 , 6};


  // Inicializações de programa
  int i=0, j=0, k=0;

  double mapf(double val,double in_min,double in_max,double out_min,double out_max) {
    return (val-in_min)*(out_max-out_min)/(in_max-in_min)+out_min;
  }

  // Setup
  void setup()
  {
    Timer1.initialize(1000000*T);      // Inicializa Timer1 com período de amostragem (em us)
    Timer1.attachInterrupt(controle);  // Define a interrupção de tempo
  }


  // Interrupção de tempo
  void controle() {

    y = C * x;
    e = Ref - y;
    int_e = int_e + e * T;
    xhat = xhat + ((A - L * C) * xhat + (B * u) + (L * y)) * T;
    u = -K * xhat - Ki * int_e;

    // Calcula os sinais de controle saturados
    for (i = 0; i < Nu; i++) {
      if (u(i) > lim_sup(i)){
        u(i) = lim_sup(i);
      } else if (u(i) < lim_inf(i)) {
        u(i) = lim_inf(i);
      }
    }
  }


  void loop() {

    // Escrever aqui as leituras, conversões de sinal, etc.
    x(0) = analogRead(A0)*5/1023 -2;
    x(1) = analogRead(A1)*16/1023 -8;
    //x(2) = ...


    // Mapeamento (float) dos sinais de controle para as saídas PWM
    for (j = 0; j < Nu; j++) {
      u_pwm(j) = mapf(u(j),lim_inf(j),lim_sup(j),minPWM(j),maxPWM(j));
    }

    // Atualização dos PWM
    for (k = 0; k < Nu; k++) {
      analogWrite(PWM_pins(k),u_pwm(k));
    };`;
  }

  showMessageError(message: string) {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      panelClass: ['red-snackbar'],
      politeness: 'assertive',
    });
  }

  showMessageSuccess(message: string) {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      panelClass: ['green-snackbar'],
      politeness: 'assertive',
    });
  }
}
