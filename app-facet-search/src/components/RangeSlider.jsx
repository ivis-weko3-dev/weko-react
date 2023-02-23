import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import React, { useState } from "react";

function RangeSlider({ value, name, labels }) {
  //If there is a space in the id attribute, it cannot be searched by ID, so escape it.
  let facet_item_id = "id_" + name + "_slider";
  let facet_item_id_for_search = CSS.escape(facet_item_id);

  function validateInputIsOk() {
    let headComp = document.getElementById(facet_item_id + "_input_head");
    let tailComp = document.getElementById(facet_item_id + "_input_tail");
    let msgComp = document.getElementById(facet_item_id + "_msg");

    // 必須チェック
    if(!headComp.value || !tailComp.value){
      if(!headComp.value) {
        setHeadStyle('form-control range-slider-error');
      }
      if(!tailComp.value) {
        setTailStyle('form-control range-slider-error');
      }
      setErrMsg('Set the value.');
      return false;
    }
    // 数値入力チェック
    //TODO 型に応じた対応
    let pattern = new RegExp(/^([1-9]\d*|0)$/);
    let headResult = pattern.exec(inputHead);
    let tailResult = pattern.exec(inputTail);

    if(headResult == null || headResult[0] != inputHead ||
        tailResult == null || tailResult[0] != inputTail) {
      if(headResult == null || headResult[0] != inputHead) {
        setHeadStyle('form-control range-slider-error');
      }
      if(tailResult == null || tailResult[0] != inputTail) {
        setTailStyle('form-control range-slider-error');
      }
      setErrMsg('Set the correct value.');
      return false;
    }

    // 相関チェック
    if(parseFloat(inputHead) > parseFloat(inputTail)) {
      setHeadStyle('form-control range-slider-error');
      setTailStyle('form-control range-slider-error');
      setErrMsg('The range from should be less than or equal to the range to.');
      return false;
    }
    //エラー情報のクリア
    setHeadStyle('form-control');
    setTailStyle('form-control');
    setErrMsg('');
    return true;
  }

  function clearUrlSlide() {
    let searchUrl = "";
    if (search.indexOf("&") >= 0) {
      let arrSearch = search.split("&");
      console.log(arrSearch)
      for (let i = 0; i < arrSearch.length; i++) {
        if (arrSearch[i].indexOf(encodeURIComponent("date_range1_from") + "=") < 0 &&
            arrSearch[i].indexOf(encodeURIComponent("date_range1_to") + "=") < 0) {
          searchUrl += "&" + arrSearch[i];
        }
      }
      //Delete "&" in First element
      searchUrl = searchUrl.substring(1);
    }
    if (searchUrl != "") {
      search = searchUrl;
    }
  }

  function handleSlide(valuelog) {
    setSliderValues([valuelog[0],valuelog[1]]);
    if(inputHead != valuelog[0]) {
      setInputHead(Math.round(valuelog[0]));
    }
    if(inputTail != valuelog[1]) {
      setInputTail(Math.round(valuelog[1]));
    }
  }

  function handleGo() {
    clearUrlSlide();
    //TODO チェックロジック
    if(!validateInputIsOk()) {
      return;
    }
    let pattern = "";
    pattern += "&" + encodeURIComponent("date_range1_from") + "=" + encodeURIComponent(inputHead);
    pattern += "&" + encodeURIComponent("date_range1_to") + "=" + encodeURIComponent(inputTail);
    search += pattern;

    if(window.invenioSearchFunctions) {
      window.history.pushState(null,document.title,"/search" + search);
      window.invenioSearchFunctions.reSearchInvenio();
    }else {
      window.location.href = "/search" + search;
    }
  }

  let search = window.location.search.replace(",", "%2C") || "?";

  // URLパラメータより最大値と最小値を取得
  let params = (new URL(document.location)).searchParams;
  // TODO 汎用化
  let minValue = params.get('date_range1_from') == null ? null : parseInt(params.get('date_range1_from'));
  let maxValue = params.get('date_range1_to') == null ? null : parseInt(params.get('date_range1_to'));
  if (value && minValue == null && maxValue == null) {
    value.map(function (subitem, k) {
      let parse_Int;
      if (subitem.key.length > 0) {
        parse_Int = parseInt(subitem.key);
        if(minValue == null || minValue > parse_Int) {
          minValue = parse_Int;
        }
        if(maxValue == null || maxValue < parse_Int) {
          maxValue = parse_Int;
        }
      }
    });
  }
  let step = (maxValue - minValue)/100;

  console.log("====== SLIEDER DEBUG   START ======");
  const [sliderValues, setSliderValues] = useState([minValue,maxValue]);
  const [inputHead, setInputHead] = useState(minValue);
  const [inputTail, setInputTail] = useState(maxValue);
  const [headStyle, setHeadStyle] = useState('form-control');
  const [tailStyle, setTailStyle] = useState('form-control');
  const [errMsg, setErrMsg] = useState('');

  const clearSliderValue = () => {
    //再呼び出しされた場合の情報再設定
    setSliderValues([minValue, maxValue]);
    setInputHead(minValue);
    setInputTail(maxValue);
    setHeadStyle('form-control');
    setTailStyle('form-control');
    setErrMsg('');
  }
  window.facetSearchFunctions[name + '_clearSliderValue'] = clearSliderValue;

  return (
    <div id={facet_item_id}>
      <div className="col-sm-11" style={{ paddingBottom: "20px", "white-space": "nowrap" }}>
        <Slider.Range min={minValue} max={maxValue} step={step} onChange={handleSlide} defaultValue={sliderValues} value={sliderValues} />
      </div>
      <div className="form-group row">
        <div className="col-sm-5">
          <input type="number" id={facet_item_id + "_input_head"} className={headStyle}
            value={inputHead}
            onChange={e => setInputHead(e.target.value)}
          />
        </div>
        <div className="col-sm-5">
          <input type="number" id={facet_item_id + "_input_tail"} className={tailStyle}
            value={inputTail}
            onChange={e => setInputTail(e.target.value)}
          />
        </div>
        <div className="col-sm-2">
          <button type="button" style={{ marginLeft: "3px" }}
            className="btn btn-primary pull-right"
            onClick={handleGo}> 検索
          </button>
        </div>
      </div>
      <div className="range-slider-error-msg" id={facet_item_id + "_msg"}>{errMsg}</div>
    </div>
  )
}

export default RangeSlider;
