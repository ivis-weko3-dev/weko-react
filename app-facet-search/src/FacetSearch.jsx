import React,{ useState }from "react";
import fetch from "unfetch";
import Select from 'react-select'
import Slider from 'rc-slider';
import 'rc-tooltip/assets/bootstrap.css';
import 'rc-slider/assets/index.css';
import {Collapse} from 'reactstrap';

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
    };
    this.getTitle = this.getTitle.bind(this);
    this.get_facet_search_list = this.get_facet_search_list.bind(this);
    this.convertData = this.convertData.bind(this);
    this.getUrlVars = this.getUrlVars.bind(this);
  }

  getTitle() {
    let titleLst = {};
    fetch("/facet-search/get-title", {
      method: "POST",
    })
      .then((r) => r.json())
      .then((response) => {
        if (response.status) {
          titleLst = response.data;
        }
        this.setState({ list_title: titleLst });
      });
  }

  get_facet_search_list() {
    let search = window.location.search;
    let url = "/api/records/";
    let params = this.getUrlVars();
    if (params.search_type && String(params.search_type) === "2") {
      url = "/api/index/";
    }
    fetch(url + search)
      .then((r) => r.json())
      .then((res) => {
        if (params.search_type && String(params.search_type) === "2") {
          // Index faceted search
          const data =
            res &&
            res.aggregations &&
            res.aggregations.path &&
            res.aggregations.path.buckets &&
            res.aggregations.path.buckets[0]
              ? res.aggregations.path.buckets[0]
              : {};
          this.convertData(data && data[0] ? data[0] : {});
        } else {
          // default faceted search
          this.convertData(res && res.aggregations ? res.aggregations : {});
        }
      });
  }

  getUrlVars() {
    let vars = {};
    let pattern = /[?&]+([^=&]+)=([^&]*)/gi;
    window.location.href.replace(pattern, function (m, key, value) {
      vars[key] = value;
    });
    return vars;
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
        }
      });
    }
    this.setState({ list_facet: list_facet });
  }

  componentDidMount() {
    this.getTitle();
    this.get_facet_search_list();
  }

  render() {
    const { is_enable, list_title, list_facet } = this.state;
    return (
      <div>
        {is_enable && (
          <div className="facet-search break-word">
            {Object.keys(list_facet).map(function (name, key) {
              const item = list_facet[name];
              const nameshow = list_title[name];
              return (
                <Rangefacet item={item} nameshow={nameshow} name={name} key={key} />
              );
            })}

          </div>
        )}

      </div>
    );
  }
}


function Rangefacet({ item, nameshow, name, key }) {
  const toggle = () => setIsOpen(!isOpen);
  const search = window.location.search.replace(",", "%2C");
  const is_check = 
  search.indexOf(encodeURIComponent(name)) >= 0 ? true : false;
  const [isOpen, setIsOpen] = useState(is_check);
  return (
    <div className="panel panel-default" key={key}>
      <div className="panel-heading clearfix">
        <h3 className="panel-title pull-left">{nameshow}</h3>
        <a className="pull-right"
          onClick={toggle}>
          {!isOpen && (
            <span>
              <i className="glyphicon glyphicon-chevron-right"></i>
            </span>
          )}
          {isOpen && (
            <span>
              <i className="glyphicon glyphicon-chevron-down"></i>
            </span>
          )}
        </a>
      </div>
      <Collapse isOpen={isOpen}>
        <div className="panel-body index-body">
          {!check_temp(name) && <RagneSelect value={item.buckets} name={name} />}
          {check_temp(name) && false && <RagneSlider value={item.buckets} name={name} />}
        </div>
      </Collapse>
    </div>
  )
}


function RagneSelect({value, name}) {
  
  function handleChange(params) {

    let searchUrl = "";
    if (search.indexOf("&") >= 0) {
      let arrSearch = search.split("&");
      console.log(arrSearch)
      for (let i = 0; i < arrSearch.length; i++) {
        if (arrSearch[i].indexOf(encodeURIComponent(name) + "=") < 0) {
          searchUrl += "&" + arrSearch[i];
        }
      }
      //Delete "&" in First element
      searchUrl = searchUrl.substring(1);
    }
    if (searchUrl != ""){
      search = searchUrl;
    }
    params.map(function (subitem, k) {
      const pattern =
        encodeURIComponent(name) +
        "=" +
        encodeURIComponent(subitem.value);
      search += "&" + pattern;

    });
    window.location.href = "/search" + search;
}

  let search = window.location.search.replace(",", "%2C") || "?";
  let options_default = [];
  let options = [];
  if (value) {
    value.map(function (subitem, k) {
      let option = 
      {
        label: "",
        value: "",
      };
      const pattern =
        encodeURIComponent(name) +
        "=" +
        encodeURIComponent(subitem.key);

      const is_check =
        search.indexOf(pattern + "&") >= 0 ? true : false;
      const is_end = search.endsWith(pattern);
      option.label = (LABELS[subitem.key] || subitem.key) + "(" + subitem.doc_count + ")"
      option.value = subitem.key
      options.push(option);
      if (is_check || is_end) {
        options_default.push(option);
      }
    });
  }
  return (
    <div>
      <div className="select-container">
        <Select
          defaultValue={options_default}
          isMulti
          name='Facet_Search'
          onChange={(_selectedOption) =>{
            handleChange(_selectedOption);
          }}
          options={options}
          className="basic-multi-select"
          classNamePrefix="select"
        />
      </div>
    </div>
  )
}

function  check_temp(name){
  return name === 'Temporal'
}


function RagneSlider({ value, name }) {

  function clearUrlSlide() {
    let searchUrl = "";
    if (search.indexOf("&") >= 0) {
      let arrSearch = search.split("&");
      console.log(arrSearch)
      for (let i = 0; i < arrSearch.length; i++) {
        if (arrSearch[i].indexOf(encodeURIComponent(name) + "=") < 0) {
          searchUrl += "&" + arrSearch[i];
        }
      }
      //Delete "&" in First element
      searchUrl = searchUrl.substring(1);
    }
    if (searchUrl != ""){
      search = searchUrl;
    }
  }

  function handleSlide(valuelog) {

    clearUrlSlide();
    let arrShowSlide = Object.keys(marks);
    for (let i = 0; i < arrShowSlide.length; i++) {
      if ((arrShowSlide[i] >= valuelog[0]) && (arrShowSlide[i] <= valuelog[1])) {
        const pattern =
          encodeURIComponent(name) +
          "=" +
          encodeURIComponent(marks[arrShowSlide[i]]);
        search += "&" + pattern;

      }

    }
    window.location.href = "/search" + search;
  }

  function handleGo() {

    clearUrlSlide();
    let valuelog = [parseInt(inputHead), parseInt(inputTail)]
    let arrShowSlide = Object.values(marks);
    for (let i = 0; i < arrShowSlide.length; i++) {
      if ((parseInt(arrShowSlide[i]) >= valuelog[0]) && (parseInt(arrShowSlide[i]) <= valuelog[1])) {
        const pattern =
          encodeURIComponent(name) +
          "=" +
          encodeURIComponent(arrShowSlide[i]);
        search += "&" + pattern;
      }
    }
    window.location.href = "/search" + search;
  }
  let marks ={};
  let distance;
  // Put to Matks
  let point_mark ;
  let marks_arr= [];
  let search = window.location.search.replace(",", "%2C") || "?";
  if (value){
    value.map(function (subitem, k) {
      let parse_Int;
      if (subitem.key.length > 0){
        parse_Int = parseInt(subitem.key);
        marks_arr.push(parse_Int);
      }
    });
  }
  if (marks_arr.length > 1){
    // Sort 
    marks_arr.sort();

    distance = 100/(marks_arr.length -1) ;
    for(point_mark in marks_arr ){
      marks[point_mark*distance] = marks_arr[point_mark].toString();
    }
  }

  const [inputHead, setInputHead] = useState(marks_arr[0]);
  const [inputTail, setInputTail] = useState(marks_arr[point_mark]);

  return (
    <div>
      <div className="col-sm-11" style={{ paddingBottom: "20px" }}>
        <Slider.Range min={0} marks={marks} step={distance} onChange={handleSlide} defaultValue={[0, 100]} />
      </div>
      <div className="form-group row">
        <div className="col-sm-5">
          <input type="number" id="input_head" className="form-control"
            value={inputHead}
            onChange={e => setInputHead(e.target.value)}
          />
        </div>
        <div className="col-sm-5">
          <input type="number" id="input_tail" className="form-control"
            value={inputTail}
            onChange={e => setInputTail(e.target.value)}
          />
        </div>
        <div className="col-sm-2">
          <button type="button" style={{ marginLeft: "3px" }}
            className="btn btn-primary pull-right"
            onClick={handleGo}> {LABELS['Goto']}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FacetSearch;