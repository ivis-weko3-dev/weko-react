import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import React from "react";
import fetch from "unfetch";
import RangeFacet from "./components/RangeFacet";

//Get all labels.
const LABELS = {};
let labels = document.getElementsByClassName("body-facet-search-label");
for (let i = 0; i < labels.length; i++) {
  LABELS[labels[i].id] = labels[i].value;
}

class FacetSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      is_enable: true,
      list_title: {},
      list_facet: {},
      list_order: {}
    };
    this.getTitleAndOrder = this.getTitleAndOrder.bind(this);
    this.get_facet_search_list = this.get_facet_search_list.bind(this);
    this.convertData = this.convertData.bind(this);
  }

  getTitleAndOrder() {
    let titleLst = {};
    let orderLst = {};
    fetch("/facet-search/get-title-and-order", {method: "POST"})
      .then((r) => r.json())
      .then((response) => {
        if (response.status) {
          titleLst = response.data.titles;
          orderLst =response.data.order;
        }
        this.setState({ list_title: titleLst });
        this.setState({ list_order: orderLst });
      });
  }

  get_facet_search_list() {
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
      	    	delete list_facet[name].buckets[i];
      	      } else if ((l != "en") && ((a.key).charCodeAt(0) < 256 && (a.key).charCodeAt(a.key.length - 1) < 256)) {
      	    	delete list_facet[name].buckets[i];
      	      }
      	    }
          }
          if (name == "Access"){
      	    let tmp = list_facet[name];
      
      	    for (let i = 0; i < tmp.buckets.length; i++) {
      	      let a = tmp.buckets[i];
      
      	      if (((a.key).charCodeAt(0) > 256 || (a.key).charCodeAt(a.key.length - 1) > 256)) {
      	    	delete list_facet[name].buckets[i];
      	      } 
      	    }
          }
          //END:temporary fix for JDCat
        }
      });
    }
    this.setState({list_facet: list_facet});
  }

  componentDidMount() {
    this.getTitleAndOrder();
    this.get_facet_search_list();
  }

  render() {
    const { is_enable, list_title, list_facet, list_order } = this.state;
    return (
      <div>
        {is_enable && (
          <div className="facet-search break-word">
            {Object.keys(list_order).map(function (order, key) {
              const name = list_order[order];
              const item = list_facet[name];
              const nameshow = list_title[name];
              return (
                <RangeFacet item={item} nameshow={nameshow} name={name} key={key} labels={LABELS} />
              );
            })}
          </div>
        )}
      </div>
    );
  }
}

export default FacetSearch;
