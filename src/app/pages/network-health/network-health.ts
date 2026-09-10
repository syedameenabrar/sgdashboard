import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IndicatorCardComponent } from '../../components/indicator-card/indicator-card';
import * as d3 from 'd3';

import { PartnerLogosComponent } from '../../components/partner-logos/partner-logos';
import { CarouselComponent } from '../../components/carousel/carousel';
import { LineChartComponent } from '../../components/line-chart/line-chart';
import { PieChartComponent } from '../../components/pie-chart/pie-chart';
import { CountryView } from '../country-view/country-view';
import { SliderCarouselComponent } from '../../components/slider-carousel/slider-carousel';
import { CatalysingNetwork1 } from '../catalysing-network-1/catalysing-network-1';
import { NETWORK_HEALTH_PAGE } from '../../../constants/urlConstants';
import { environment } from '../../../../environments/environment';
import { WorldMapComponent } from '../world-map/world-map';
import { ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { LoaderRunnerService } from '../../services/loader-runner.service';


@Component({
  selector: 'app-network-health',
  standalone:true,
  imports:[CommonModule, RouterModule, IndicatorCardComponent, PartnerLogosComponent, CarouselComponent, LineChartComponent, PieChartComponent,CountryView, SliderCarouselComponent, CatalysingNetwork1, WorldMapComponent, MatIconModule, MatDialogModule, MatButtonModule ],
  templateUrl: './network-health.html',
  styleUrls: ['./network-health.css']
})
export class NetworkHealth implements OnInit {
  @ViewChild('glossaryTemplate') glossaryTemplate!: TemplateRef<any>;
  pageData: any = {};
  baseUrl:any = `${environment.storageURL}/${environment.bucketName}/${environment.folderName}`


  constructor(private cdr: ChangeDetectorRef,private dialog: MatDialog, private breakpointObserver: BreakpointObserver, 
    private loaderRunner: LoaderRunnerService
  ) {}

  ngOnInit(): void {
    this.fetchPageData();
  }

  async fetchPageData() {
    await this.loaderRunner.run(async () => {
    return d3.json(`${this.baseUrl}/${NETWORK_HEALTH_PAGE}`).then((data: any) => {
      this.pageData = data;
      this.prepareLogosForScrolling();
      this.cdr.detectChanges();
    }).catch((error: any) => {
      console.error('Error loading page data:', error);
    });
  });
  }

  prepareLogosForScrolling(): void {
    const partnerLogosSection = this.pageData.sections.find((s:any) => s.type === 'partner-logos');
    if (partnerLogosSection && partnerLogosSection.partners) {
      this.pageData.allLogos = partnerLogosSection.partners.flatMap((p:any) => p.logos);
    }
  }

  openGlossary() {
    if (!this.glossaryTemplate) {
      console.error('Glossary template not found');
      return; // stop execution to avoid runtime error
    }
    const isMobile = this.breakpointObserver.isMatched(Breakpoints.Handset);
    const isTablet = this.breakpointObserver.isMatched(Breakpoints.Tablet);
    this.dialog.open(this.glossaryTemplate, {
      width: isMobile ? 'calc(100% - 2rem)' : '600px',
      maxWidth: '1000px',
      position: isMobile
        ? { top: '38%', right: '1rem' }
        : isTablet
          ? { top: '18%', right: '8%' }
          : { top: '12%', right: '10%' },

      panelClass:'glossary-side-dialog',
      backdropClass: 'glossary-backdrop'
    });
  }

}
