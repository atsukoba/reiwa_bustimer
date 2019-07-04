import { action, observable, computed } from "mobx";
import { useStaticRendering } from 'mobx-react';

import dateFormatter from '../helpers/dateFormatter';


//TODO baseUrl の置き方考える
const baseUrl = 'https://bus.im-neko.net';
const isServer = !process.browser
useStaticRendering(isServer);


export default class MainStore {

  _getPosStr = (pos: string) => {
      switch (pos) {
        case 'sho':
          return '湘南台';
        case 'sfc':
          return 'SFC';
        case 'tuji':
          return '辻堂';
        default:
          return 'test';
      }
  }

  @observable.ref
  timeTable: object = {};

  @observable.ref
  holidays: object = {};

  @observable.ref
  leftBuses: object = [{ h:0, m:0,
               from: 'sho', to: 'sfc',
               twin: false, rotary: false,
               type: 'normal'}];

  constructor(isServer, initialData = {}) {
    this.timeTable = initialData.timeTable;
    this.holidays = initialData.holidays;
    this.date = dateFormatter.toDateObj(new Date());
  }

  @observable
  isLoading: boolean = true;

  @observable
  bustimerUrl: string = 'https://bustimer.keioac.jp';

  @observable
  date: object = {};

  @observable
  leftTime = false;

  @observable
  from: string = 'sho';

  @observable
  fromStr: string = '湘南台';

  @observable
  to: string = 'sfc';

  @observable
  toStr: string = 'SFC';

  @observable
  selectedPos: string = 'sho';

  @observable
  wayToSchool: string = '登校';

  @observable
  taxiHashtags: string = 'bustimer,SFC生相乗り募集';

  @observable
  pathName: string = '/';

  @observable
  beforePath: string = '/';

  @computed
  get tweetHashtags () {
    return `bustimer,${this.wayToSchool}なう`;
  }

  @computed
  get busKaitekiText () {
    if (this.from === 'sfc') {
      return `「${this.toStr}行き ${('00'+this.leftBuses[0].h).slice(-2)}時 ${('00'+this.leftBuses[0].m).slice(-2)}分のバス」快適なう`;
    }
    return `「${this.fromStr}発 ${('00'+this.leftBuses[0].h).slice(-2)}時 ${('00'+this.leftBuses[0].m).slice(-2)}分のバス」快適なう`;
  }

  @computed
  get busKonzatuText () {
    if (this.from === 'sfc') {
      return `「${this.toStr}行き ${('00'+this.leftBuses[0].h).slice(-2)}時 ${('00'+this.leftBuses[0].m).slice(-2)}分のバス」混雑なう`;
    }
    return `「${this.fromStr}発 ${('00'+this.leftBuses[0].h).slice(-2)}時 ${('00'+this.leftBuses[0].m).slice(-2)}分のバス」混雑なう`;
  }

  @computed
  get ogpDescription () {
    if (this.leftBuses.length) {
      return `${this.fromStr}発 ${('00'+this.leftBuses[0].h).slice(-2)}時 ${('00'+this.leftBuses[0].m).slice(-2)}分のバス待ちなう`;
    } else {
      return `${this.fromStr}でバス難民なう`;
    }
  }

  @action
  setLoading = isLoading => {
    this.isLoading = isLoading;
  }

  @action
  setPath = (beforePath, nextPath) => {
    this.beforePath = beforePath;
    this.pathName = nextPath;
  }

  @action
  setDate = () => {
    this.date = dateFormatter.toDateObj(new Date());
  }

  @action
  setFromTo = (from: string, to: string) => {
    this.from = from;
    this.fromStr = this._getPosStr(from);
    this.to = to;
    this.toStr = this._getPosStr(to);
    if (this.from === 'sfc') {
      this.wayToSchool =  '下校';
      this.selectedPos = to;
    } else {
      this.wayToSchool = '登校';
      this.selectedPos = from;
    }
    if(!isServer) {
      const cache = {
        from: this.from,
        to: this.to,
      }
      localStorage.setItem('cache', JSON.stringify(cache))
    }
  }

  @action
  setLeftBuses = () => {
    const isHoliday = ((this.date.monthStr+this.date.dayStr) in this.holidays) || this.date.dayOfWeek === 0;
    const todayData = isHoliday
      ?this.timeTable[this.from][this.to].holiday
      :this.date.dayOfWeek===6
        ?this.timeTable[this.from][this.to].saturday
        :this.timeTable[this.from][this.to].weekday;
    this.leftBuses = todayData.filter(time => {
      return (
        (time.h > this.date.hour)
        ||
        (
          time.h === this.date.hour &&
          time.m > this.date.minute
        )
      )
    });
  }

  @action
  setLeftTime = () => {
    if (this.leftBuses.length) {
      const bus = this.leftBuses[0];
      const date = this.date;
      let leftMinute, leftSecond;
      leftSecond = 60 - date.second - 1;
      if (bus.h > date.hour){
        leftMinute = ((bus.h - date.hour) * 60)
          - date.minute
          + bus.m - 1;
      } else {
        leftMinute = bus.m - date.minute -1;
      }
      this.leftTime = {
        m: leftMinute,
        s: leftSecond
      }
    } else {
      this.leftTime = {
        m: 0,
        s: 0
      }
    }
  }

}