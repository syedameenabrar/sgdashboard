import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener, Input, Output, EventEmitter } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { IndicatorCardComponent } from '../../components/indicator-card/indicator-card';
import { MiniIndicatorCardComponent } from '../../components/mini-indicator-card/mini-indicator-card';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { COMMUNITY_DASHBOARD_PAGE, COMMUNITY_MAP_DATA, DISTRICT_VIEW_INDICATORS, INDIA } from '../../../constants/urlConstants';
import { LoaderRunnerService } from '../../services/loader-runner.service';

@Component({
  selector: 'app-country-view',
  standalone: true,
  imports: [CommonModule, MiniIndicatorCardComponent, KeyValuePipe, MatSelectModule, FormsModule, ReactiveFormsModule],
  templateUrl: './country-view.html',
  styleUrls: ['./country-view.css']
})
export class CountryView implements OnInit, AfterViewInit {
  @ViewChild('indiaMapContainer') private mapContainer!: ElementRef;
  @Input() showDetails: boolean = false;
  @Input() showVariations: boolean = false;
  @Input() legends: any = [];
  @Input() selections: any = [];
  @Output() stateSelected = new EventEmitter<string>();
  @Input() resourcePath: string = '';
  @Input() redirectPath?: any = '';
  @Input() notes: any = [];
  selectedIndicator: string = 'Micro Improvements Initiated';
  hoveredState: string = "";
  dashboardPage = window.location.pathname.includes('/dashboard') ? true : false

  indicatorData: { value: number | string; label: string }[] = [];
  baseUrl: any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`;
  displayLegends: any = [];
  isMobile = false;

  private readonly isTouchDevice =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // Embedded JSON data
  private indicatorJson = {
    "result": {
      "states": {}
    }
  };

  constructor(private router: Router, private loaderRunner: LoaderRunnerService) { }

  ngOnInit(): void {
    this.fetchCommunityData();
    this.fetchIndicatorData();
    this.checkIfMobile();
  }
  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
  @HostListener('window:scroll', [])
  onScroll() {
    if (this.isMobile) {
      d3.select("#map-tooltip").transition().duration(0).style("opacity", 0);
    }
  }

  async fetchCommunityData() {
  await this.loaderRunner.run(async () => {

    return d3.json(`${this.baseUrl}/${COMMUNITY_MAP_DATA}`).then((data: any) => {
      this.indicatorJson = data;
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  });

  }

  fetchIndicatorData(stateCode?: string, forTooltip: boolean = false): Promise<any> {
    // Use embedded JSON instead of fetching
    return d3.json(this.resourcePath.length > 0 ? (this.resourcePath.includes('https://') ? this.resourcePath : `${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${this.resourcePath}`) :`${this.baseUrl}/${DISTRICT_VIEW_INDICATORS}`).then((data: any) => {
      const statesData = data.result.states;
      const labels = data.result.meta?.labels || {};
      let details = (stateCode && statesData[stateCode]) ? statesData[stateCode].details : data.result.overview.details;
      let processedData: { value: number | string; label: string }[] = [];
      this.hoveredState = stateCode ? statesData[stateCode].label : "";

      if (details) {
        if (forTooltip && this.showVariations && this.selectedIndicator) {
          const filteredDetails = details.filter((item: any) => labels[item.code] === this.selectedIndicator);
          processedData = filteredDetails.map((item: any) => ({
            value: item.value,
            label: labels[item.code]
          }));
        } else {
          processedData = details.map((item: any) => ({
            value: item.value,
            label: labels[item.code] ?? item.code
          }));
        }
      }

      if (!forTooltip) {
        this.indicatorData = processedData;
      }
      return processedData;
    }).catch((error: any) => {
      console.error('Error processing indicator data:', error);
      if (!forTooltip) {
        this.indicatorData = [];
      }
      return [];
    });
  }

  ngAfterViewInit(): void {
    this.drawMap();
  }

  private resizeTimeout: any;
  private lastViewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (window.innerWidth === this.lastViewportWidth) {
      return;
    }
    this.lastViewportWidth = window.innerWidth;

    if(!this.isMobile){
       clearTimeout(this.resizeTimeout);
       this.resizeTimeout = setTimeout(() => this.drawMap(), 200);
    }
  }

  private drawMap(): void {
    d3.select('#india-map-container svg').remove();

    const container = this.mapContainer.nativeElement;
    const containerWidth = container.offsetWidth;
    let height = containerWidth * 0.8;
    if (window.innerWidth < 768) {
    // For mobile, use a larger height relative to the width
    // This will make the map appear bigger and more prominent
    height = containerWidth * 1.1; // Increase the multiplier for more height
   }

    const tooltip = d3.select("#map-tooltip");

    Promise.all([
      d3.json(`${this.baseUrl}/${INDIA}`),
      d3.json(this.resourcePath.length > 0 ? (this.resourcePath.includes('https://') ? this.resourcePath : `${environment.storageURL}/${environment.bucketName}/${environment.folderName}/${this.resourcePath}`) :`${this.baseUrl}/${DISTRICT_VIEW_INDICATORS}`)
    ]).then(([india, indicatorData]: [any, any]) => {
      const statesData = indicatorData.result.states; // Use indicatorData for colors and interactions
      const iconStatesData: any = this.indicatorJson.result.states; // Use indicatorJson only for icons
      const labels = indicatorData.result.meta.labels;
      const legends = indicatorData.result.meta.legends;
      this.legends = legends;
      this.displayLegends = Object.values(legends).map((item: any) => ({
        label: item.label,
        color: item.color,
        icon: item.icon
      }));
      const activeStates = indicatorData.result.overview;
      const states = topojson.feature(india, india.objects.states) as any;
      const districts = topojson.feature(india, india.objects.districts) as any;

      const projection = d3.geoMercator().fitSize([containerWidth, height], states);
      const path = d3.geoPath().projection(projection);

      const svg = d3.select('#india-map-container')
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', height)
        .attr('viewBox', `0 0 ${containerWidth} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      // Render state paths with original color logic
      svg.selectAll('.state-path')
        .data(states.features)
        .enter().append('path')
        .attr('class', 'state-path')
        .attr('z-index', '1000')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const stateCode = d.properties.st_code;
          const stateInfo = statesData[stateCode];
          if (stateInfo) {
            return (typeof legends[stateInfo.type]?.color === 'object' ? legends[stateInfo.type]?.color[this.selectedIndicator] : legends[stateInfo.type]?.color) || '#fff';
          } else {
            return '#fff';
          }
        })
        .attr('stroke', '#000')
        .attr('z-index', '1000')
        .attr('stroke-width', 1)
        .style('cursor', (d: any) => {
          const stateCode = d.properties.st_code;
          return statesData[stateCode] ? 'pointer' : 'default';
        })
        .on('mouseover', (event: any, d: any) => {
          if (this.isTouchDevice) return;
          const stateCode = d.properties.st_code;
          const stateInfo = statesData[stateCode];
          const stateName = d.properties.st_nm || 'Unknown State'; // Fallback to state name from topojson
          if (stateInfo) {
            if (this.showDetails) {
              this.fetchIndicatorData(stateCode);
            }
            const selectedDetail = stateInfo.details.find((detail: any) => {
              const detailCode = detail.code?.toLowerCase().replace(/\s+/g, '');
              const selectedCode = this.selectedIndicator?.toLowerCase().replace(/\s+/g, '');
              return detailCode === selectedCode;
            });
            if (selectedDetail) {
              tooltip.transition().duration(200).style("opacity", .9);
              let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${stateInfo.label}</div>
                <div style="font-size: 14px; color: #333; font-weight: 500;">${selectedDetail.code || ''}</div>
                <div style="font-size: 20px; color: #e6007a; font-weight: bold;">${selectedDetail.value}</div>
              </div>`;
              this.positionTooltip(event, document.getElementById('map-tooltip')!);
              tooltip.html(tooltipHtml);
            } else {
              tooltip.transition().duration(200).style("opacity", .9);
              let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${stateInfo.label}</div>
              </div>`;
              this.positionTooltip(event, document.getElementById('map-tooltip')!);
              tooltip.html(tooltipHtml);
            }
          } else {
            // Show tooltip for states without data
            tooltip.transition().duration(200).style("opacity", .9);
            let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${stateName}</div>
            </div>`;
            this.positionTooltip(event, document.getElementById('map-tooltip')!);
            tooltip.html(tooltipHtml);
          }
        })
        .on('mousemove', (event: any) => {
          if (this.isTouchDevice) return;
          this.positionTooltip(event, document.getElementById('map-tooltip')!);
        })
        .on('mouseout', () => {
          if (this.showDetails) {
            this.fetchIndicatorData();
          }
          tooltip.transition().duration(500).style("opacity", 0);
        })
        .on('click', (event: any, d: any) => {
          if(this.isMobile && !this.showDetails){
             const stateCode = d.properties.st_code;
          const stateInfo = statesData[stateCode];
          const stateName = d.properties.st_nm || 'Unknown State'; // Fallback to state name from topojson
          if (stateInfo) {
            if (this.showDetails) {
              this.fetchIndicatorData(stateCode);
            }
            const selectedDetail = stateInfo.details.find((detail: any) => {
              const detailCode = detail.code?.toLowerCase().replace(/\s+/g, '');
              const selectedCode = this.selectedIndicator?.toLowerCase().replace(/\s+/g, '');
              return detailCode === selectedCode;
            });
            if (selectedDetail) {
              tooltip.transition().duration(200).style("opacity", .9);
              let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${stateInfo.label}</div>
                <div style="font-size: 14px; color: #333; font-weight: 500;">${selectedDetail.code || ''}</div>
                <div style="font-size: 20px; color: #e6007a; font-weight: bold;">${selectedDetail.value}</div>
              </div>`;
              this.positionTooltip(event, document.getElementById('map-tooltip')!);
              tooltip.html(tooltipHtml);
            } else {
              tooltip.transition().duration(200).style("opacity", .9);
              let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${stateInfo.label}</div>
              </div>`;
              this.positionTooltip(event, document.getElementById('map-tooltip')!);
              tooltip.html(tooltipHtml);
            }
          } else {
            // Show tooltip for states without data
            tooltip.transition().duration(200).style("opacity", .9);
            let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${stateName}</div>
            </div>`;
            this.positionTooltip(event, document.getElementById('map-tooltip')!);
            tooltip.html(tooltipHtml);
          }

          }else{
            const stateCode = d.properties.st_code;
          const stateInfo = statesData[stateCode];
          if (this.showDetails && stateInfo) {
            this.fetchIndicatorData(stateCode);
            const stateName = stateInfo.label;
            if (stateName) {
              let path = this.redirectPath ? this.redirectPath : "state-view";
              this.stateSelected.emit(stateInfo.label);
              this.router.navigate([path, stateName, stateCode]);
            }
          } else if (!this.showDetails) {
            this.stateSelected.emit(stateInfo?.label || '');
            this.router.navigate(['/dashboard']); 
          }

          }
          
        });

      // Add SVG icons only for states in indicatorJson (Bihar and Karnataka)
      svg.selectAll('.state-icon')
        .data(states.features.filter((d: any) => iconStatesData[d.properties.st_code]))
        .enter()
        .append('image')
        .attr('class', 'state-icon')
        .attr('x', (d: any) => {
          const centroid = path.centroid(d);
          return centroid[0] - 10; // Adjust x to center the 20x20 icon
        })
        .attr('y', (d: any) => {
          const centroid = path.centroid(d);
          return centroid[1] - 10; // Adjust y to center the 20x20 icon
        })
        .attr('width', 20) // Icon width
        .attr('height', 20) // Icon height
        .attr('xlink:href', 'assets/icons/community_map_icon.svg') // Path to the SVG icon
        .style('cursor', (d: any) => {
          const stateCode = d.properties.st_code;
          return iconStatesData[stateCode] ? 'pointer' : 'default';
        })
        .on('mouseover', (event: any, d: any) => {
          if (this.isTouchDevice) return;
          const stateCode = d.properties.st_code;
          const stateInfo = statesData[stateCode];
          const stateName = d.properties.st_nm || 'Unknown State'; // Fallback to state name from topojson
          if (stateInfo) {
            if (this.showDetails) {
              this.fetchIndicatorData(stateCode);
            }
            const selectedDetail = stateInfo.details.find((detail: any) => {
              const detailCode = detail.code?.toLowerCase().replace(/\s+/g, '');
              const selectedCode = this.selectedIndicator?.toLowerCase().replace(/\s+/g, '');
              return detailCode === selectedCode;
            });
            if (selectedDetail) {
              tooltip.transition().duration(200).style("opacity", .9);
              let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${stateInfo.label}</div>
                <div style="font-size: 14px; color: #333; font-weight: 500; text-transform: capitalize;">${selectedDetail.code || ''}</div>
                <div style="font-size: 20px; color: #e6007a; font-weight: bold;">${selectedDetail.value}</div>
              </div>`;
              this.positionTooltip(event, document.getElementById('map-tooltip')!);
              tooltip.html(tooltipHtml);
            } else {
              tooltip.transition().duration(200).style("opacity", .9);
              let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${stateInfo.label}</div>
              </div>`;
              this.positionTooltip(event, document.getElementById('map-tooltip')!);
              tooltip.html(tooltipHtml);
            }
          } else {
            // Show tooltip for states without data
            tooltip.transition().duration(200).style("opacity", .9);
            let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${stateName}</div>
            </div>`;
            this.positionTooltip(event, document.getElementById('map-tooltip')!);
            tooltip.html(tooltipHtml);
          }
        })
        .on('mousemove', (event: any) => {
          if (this.isTouchDevice) return;
          this.positionTooltip(event, document.getElementById('map-tooltip')!);
        })
        .on('mouseout', () => {
          if (this.showDetails) {
            this.fetchIndicatorData();
          }
          tooltip.transition().duration(500).style("opacity", 0);
        })
        .on('click', (event: any, d: any) => {
          if(this.isMobile && !this.showDetails){
            const stateCode = d.properties.st_code;
          const stateInfo = statesData[stateCode];
          const stateName = d.properties.st_nm || 'Unknown State'; // Fallback to state name from topojson
          if (stateInfo) {
            if (this.showDetails) {
              this.fetchIndicatorData(stateCode);
            }
            const selectedDetail = stateInfo.details.find((detail: any) => {
              const detailCode = detail.code?.toLowerCase().replace(/\s+/g, '');
              const selectedCode = this.selectedIndicator?.toLowerCase().replace(/\s+/g, '');
              return detailCode === selectedCode;
            });
            if (selectedDetail) {
              tooltip.transition().duration(200).style("opacity", .9);
              let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${stateInfo.label}</div>
                <div style="font-size: 14px; color: #333; font-weight: 500; text-transform: capitalize;">${selectedDetail.code || ''}</div>
                <div style="font-size: 20px; color: #e6007a; font-weight: bold;">${selectedDetail.value}</div>
              </div>`;
              this.positionTooltip(event, document.getElementById('map-tooltip')!);
              tooltip.html(tooltipHtml);
            } else {
              tooltip.transition().duration(200).style("opacity", .9);
              let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
                <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${stateInfo.label}</div>
              </div>`;
              this.positionTooltip(event, document.getElementById('map-tooltip')!);
              tooltip.html(tooltipHtml);
            }
          } else {
            // Show tooltip for states without data
            tooltip.transition().duration(200).style("opacity", .9);
            let tooltipHtml = `<div style="padding: 8px 12px; border-radius: 6px; text-align: center;">
              <div style="font-size: 16px; color: #333; font-weight: bold; text-transform: capitalize;">${stateName}</div>
            </div>`;
            this.positionTooltip(event, document.getElementById('map-tooltip')!);
            tooltip.html(tooltipHtml);
          }

          }else{
           const stateCode = d.properties.st_code;
          const stateInfo = statesData[stateCode];
          if (this.showDetails && stateInfo) {
            this.fetchIndicatorData(stateCode);
            const stateName = stateInfo.label;
            if (stateName) {
              let path = this.redirectPath ? this.redirectPath : "state-view";
              this.stateSelected.emit(stateInfo.label);
              this.router.navigate([path, stateName, stateCode]);
            }
          } else if (!this.showDetails) {
            this.stateSelected.emit(stateInfo?.label || '');
            this.router.navigate(['/dashboard']);
          }
          }
          
        });

      svg.append('path')
        .datum(districts)
        .attr('class', 'district-outline')
        .attr('d', path as any);
    }).catch((error: any) => {
      console.error('Error loading or processing data:', error);
    });
  }

  reDrawMap() {
    this.drawMap();
  }

  positionTooltip(event: MouseEvent, tooltipEl: HTMLElement) {
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    const pageWidth = window.innerWidth;
    const pageHeight = window.innerHeight;

    let left = event.clientX + 10;
    let top = event.clientY - tooltipHeight - 10;

    if ((left + tooltipWidth) > pageWidth) {
      left = event.clientX - tooltipWidth - 10;
    }

    if (left < 0) {
      left = 10;
    }

    if (top < 0) {
      top = event.clientY + 10;
    }

    if ((top + tooltipHeight) > pageHeight) {
      top = pageHeight - tooltipHeight - 10;
    }

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.position = 'fixed';
    tooltipEl.style.zIndex = '1000';
    tooltipEl.style.display = 'block'; // Ensure it's visible
  }

}
