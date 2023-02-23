import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import './index.css';
import React from "react";
import fetch from "unfetch";
import RangeFacet from "./components/RangeFacet";

//Get all labels.
const LABELS = {};
let labels = document.getElementsByClassName("body-facet-search-label");
for (let i = 0; i < labels.length; i++) {
  LABELS[labels[i].id] = labels[i].value;
}

let facetSearchComponent;

class FacetSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      is_enable: false,
      list_title: {},
      list_facet: {},
      list_order: {},
      list_uiType: {},
      list_isOpen: {},
      list_displayNumber: {}
    };
    this.getTitleAndOrder = this.getTitleAndOrder.bind(this);
    this.get_facet_search_list = this.get_facet_search_list.bind(this);
    this.convertData = this.convertData.bind(this);
    facetSearchComponent = this;
  }

  getTitleAndOrder() {
    let titleLst = {};
    let orderLst = {};
    let uiTypeLst = {};
    let isOpenLst = {};
    let displayNumberLst = {};
    fetch("/facet-search/get-title-and-order", {method: "POST"})
      .then((r) => r.json())
      .then((response) => {
        if (response.status) {
          titleLst = response.data.titles;
          orderLst = response.data.order;
          uiTypeLst = response.data.uiTypes;
          isOpenLst = response.data.isOpens;
          displayNumberLst = response.data.displayNumbers;
        }
        this.setState({ list_title: titleLst });
        this.setState({ list_order: orderLst });
        this.setState({ list_uiType: uiTypeLst });
        this.setState({ list_isOpen: isOpenLst });
        this.setState({ list_displayNumber: displayNumberLst });
        this.setState({ is_enable: true });
      });
  }

  get_facet_search_list() {
    console.debug("get_facet_search_list実行");
    let search = new URLSearchParams(window.location.search);
    let url = search.get('search_type') == 2 ? "/api/index/" : "/api/records/";
    fetch(url + '?' + search.toString())
      .then((r) => r.json())
      .then((res) => {
        if (search.get('search_type') == 2) {
          // Index faceted search
          let aggregations = res && res.aggregations && res.aggregations.aggregations
              ? res.aggregations.aggregations[0] : {};
          this.convertData(aggregations);
        } else {
          // default faceted search
          this.convertData(res && res.aggregations ? res.aggregations : {});
        }
      });
  }

  convertData(data) {
    console.debug("convertData実行");
    let list_facet = {};
    if (data) {
      Object.keys(data).map(function (name, k) {
        let val = data[name][name] ? data[name][name] : data[name];
        let hasBuckets = val["key"] && val["key"].hasOwnProperty("buckets");
        hasBuckets = val.hasOwnProperty("buckets") || hasBuckets;
        if (hasBuckets) {
          list_facet[name] = val[name] ? val[name] : val;
          //START:temporary fix for JDCat
          if (name != "Time Period(s)" && name != "Data Language" && name != "Access") {
      	    let e = document.getElementById('lang-code');
      	    let l = e.options[e.selectedIndex].value;
      	    let tmp = list_facet[name];
      
      	    for (let i = 0; i < tmp.buckets.length; i++) {
      	      let a = tmp.buckets[i];
      
      	      if ((l == "en") && ((a.key).charCodeAt(0) > 256 || (a.key).charCodeAt(a.key.length - 1) > 256)) {
      	    	//delete list_facet[name].buckets[i];
              list_facet[name].buckets.splice(i,1);
              i--;
      	      } else if ((l != "en") && ((a.key).charCodeAt(0) < 256 && (a.key).charCodeAt(a.key.length - 1) < 256)) {
      	    	//delete list_facet[name].buckets[i];
              list_facet[name].buckets.splice(i,1);
              i--;
      	      }
      	    }
          }
          if (name == "Access"){
      	    let tmp = list_facet[name];
      
      	    for (let i = 0; i < tmp.buckets.length; i++) {
      	      let a = tmp.buckets[i];
      
      	      if (((a.key).charCodeAt(0) > 256 || (a.key).charCodeAt(a.key.length - 1) > 256)) {
      	    	  //delete list_facet[name].buckets[i];
                list_facet[name].buckets.splice(i,1);
                i--;
      	      } 
      	    }
          }
          //END:temporary fix for JDCat
        }
      });
    }
    this.setState({list_facet: list_facet});
    Object.keys(data).map(function (name, k) {
      if(window.facetSearchFunctions[name + '_clearSliderValue']) {
        window.facetSearchFunctions[name + '_clearSliderValue']();
      }
    });

  }

  componentDidMount() {
    this.getTitleAndOrder();
    this.get_facet_search_list();
  }

  render() {
    const { is_enable, list_title, list_facet, list_order, list_uiType, list_isOpen, list_displayNumber } = this.state;
    return (
      <div>
        {is_enable && (
          <div className="facet-search break-word">
            {Object.keys(list_order).map(function (order, key) {
              const name = list_order[order];
              const item = list_facet[name];
              const nameshow = list_title[name];
              const isOpen = list_isOpen[name];
              const uiType = list_uiType[name];
              const displayNumber = list_displayNumber[name];
              return (
                <RangeFacet item={item} nameshow={nameshow} name={name} key={key} labels={LABELS} isInitOpen={isOpen} uiType={uiType} displayNumber={displayNumber} />
              );
            })}
          </div>
        )}
      </div>
    );
  }
}

const useFacetSearch = () => {
  return facetSearchComponent != null;
}

const resetFacetData = () => {
  console.debug("resetFacetData 呼び出されました。");
  if(facetSearchComponent != null) {
    console.debug("facetSearchComponent != null → true");
    facetSearchComponent.get_facet_search_list();
  }
}

// windowオブジェクトのグローバル変数用キーに定義した関数を入れる
window.facetSearchFunctions = {};
window.facetSearchFunctions.useFacetSearch = useFacetSearch;
window.facetSearchFunctions.resetFacetData = resetFacetData;

export default FacetSearch;
