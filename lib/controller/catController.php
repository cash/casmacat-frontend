<?php

include_once INIT::$MODEL_ROOT . "/queries.php";
include INIT::$UTILS_ROOT . "/mymemory_queries_temp.php";
include INIT::$UTILS_ROOT . "/filetype.class.php";
include_once INIT::$UTILS_ROOT . "/cat.class.php";
include INIT::$UTILS_ROOT . "/langs/languages.inc.php";

/**
 * Description of catController
 *
 * @author antonio
 */
class catController extends viewcontroller {

    //put your code here
    private $data = array();
    private $cid = "";
    private $jid = "";
    private $tid = "";
    private $password="";
    private $source="";
    private $pname = "";
    private $create_date = "";
    private $filetype_handler = null;
    private $start_from = 0;
    private $page = 0;
	private $start_time=0.00;
    private $downloadFileName;
    private $job_stats=array();
//    private $seg = '';

	private $job_not_found=false;
    // CASMACAT extension start
    private $casIsReplaying = false;
  private $fid = "";

  private $initCfg = null;
    // CASMACAT extension end

    public function __construct() {
		$this->start_time=microtime(1)*1000;
//    	log::doLog('provalog');
       // echo ".........\n";
        parent::__construct();
        parent::makeTemplate("index.html");
        $this->jid = $this->get_from_get_post("jid");
		$this->password=$this->get_from_get_post("password");
        $this->start_from = $this->get_from_get_post("start");
        $this->page = $this->get_from_get_post("page");

		if (isset($_GET['step'])) {
        	$this->step = $_GET['step'];
		} else {
        	$this->step = 1000;
		};

        if (is_null($this->page)) {
            $this->page = 1;
        }
		if (is_null($this->start_from)) {
            $this->start_from = ($this->page-1)*$this->step;
        }

        // CASMACAT extension start
        if (INIT::$LOG_ENABLED) {
            log::doLog("CASMACAT: Enabled.");
            include_once INIT::$MODEL_ROOT . "/casQueries.php";
//error_log(print_r($_REQUEST, true));
            // will be set to 'true' be the replay page that loads this page in an iframe
            if ($this->get_from_get_post("replay") == "true") {  // replay mode
                log::doLog("CASMACAT: Running in replay mode.");
                $this->casIsReplaying = true;
            }
        }
        // CASMACAT extension end

	$this->downloadFileName="";

	if (is_null($this->jid) and is_null($this->password)) {
            header("Location: /translate/esempio.xliff/en-fr/849-mcfmtvg8");
	    exit(0);
        }
    }
/*
    private function stripTagsFromSource($text) {
        //       echo "<pre>";
        $pattern_g_o = '|(<.*?>)|';
        $pattern_g_c = '|(</.*?>)|';
        $pattern_x = '|(<.*?/>)|';

        // echo "first  -->  $text \n";
        $text = preg_replace($pattern_x, "", $text);
        // echo "after1  --> $text\n";

        $text = preg_replace($pattern_g_o, "", $text);
        //  echo "after2  -->  $text \n";
//
        $text = preg_replace($pattern_g_c, "", $text);
        $text= str_replace ("&nbsp;", " ", $text);
        return $text;
    }
*/
	private function parse_time_to_edit($ms){
        if ($ms <= 0) {
            return array("00", "00", "00", "00");
        }

		$usec = $ms % 1000;
		$ms = floor($ms/ 1000);

		$seconds = str_pad($ms % 60,2,"0",STR_PAD_LEFT);
		$ms = floor($ms / 60);

		$minutes = str_pad($ms % 60,2 ,"0", STR_PAD_LEFT);
		$ms = floor($ms / 60);

	        $hours = str_pad($ms % 60,2,"0",STR_PAD_LEFT);
                $ms = floor($ms / 60);

		return array($hours,$minutes,$seconds,$usec);

	}

    public function doAction() {
    	$files_found=array();
        $lang_handler=languages::getInstance("en");

         // CASMACAT extension start
//        if ($this->casIsReplaying) {
//            $data = getSegmentsInfoWithoutTranslation($this->jid, $this->password, $this->start_from, $this->step);
//        }
//        else {
            $data = getSegmentsInfo($this->jid, $this->password);
//        }
        // CASMACAT extension end

	if (empty($data) or $data<0){
		$this->job_not_found=true;
	}

      //  echo "<pre>";
      //  print_r ($data);
      //  exit;


        $first_not_translated_found = false;

        foreach ($data as $i => $seg) {

            if (empty($this->pname)) {
                $this->pname = $seg['pname'];
		$this->downloadFileName= $seg['pname'].".zip";// will be overwritten below in case of one file job
            }

            if (empty($this->last_opened_segment)) {
                $this->last_opened_segment = $seg['last_opened_segment'];
            }

            if (empty($this->cid)) {
                $this->cid = $seg['cid'];
            }

            if (empty($this->pid)) {
                $this->pid = $seg['pid'];
            }

            if (empty($this->tid)) {
                $this->tid = $seg['tid'];
            }

            if (empty($this->create_date)) {
                $this->create_date = $seg['create_date'];
            }

            if (empty($this->source_code)) {
	            $this->source_code = $seg['source'];
	        }

	        if (empty($this->target_code)) {
	            $this->target_code = $seg['target'];
	        }

		    if (empty($this->source)) {
				$s=explode("-", $seg['source']);
				$source=strtoupper($s[0]);
	            $this->source = $source;
	        }

		if (empty($this->target)) {
				$t=explode("-", $seg['target']);
				$target=strtoupper($t[0]);
	            $this->target = $target;
	        }

            $id_file = $seg['id_file'];
          $this->fid = $id_file;


            if (!isset($this->data["$id_file"])) {
            	$files_found[]=$seg['filename'];
            	$file_stats =CatUtils::getStatsForFile($id_file);
                $this->data["$id_file"]['jid'] = $seg['jid'];
                $this->data["$id_file"]["filename"] = $seg['filename'];
                $this->data["$id_file"]["mime_type"] = $seg['mime_type'];
                $this->data["$id_file"]['id_segment_start'] = $seg['id_segment_start'];
                $this->data["$id_file"]['id_segment_end'] = $seg['id_segment_end'];
                $this->data["$id_file"]['source']=$lang_handler->iso2Language($seg['source']);
                $this->data["$id_file"]['target']=$lang_handler->iso2Language($seg['target']);
                $this->data["$id_file"]['source_code']=$seg['source'];
                $this->data["$id_file"]['target_code']=$seg['target'];
		$this->data["$id_file"]['last_opened_segment'] = $seg['last_opened_segment'];
                $this->data["$id_file"]['file_stats'] = $file_stats;
		//$this->data["$id_file"]['segments'] = array();
            }
            //if (count($this->data["$id_file"]['segments'])>100){continue;}
            $this->filetype_handler = new filetype($seg['mime_type']);



            unset($seg['id_file']);
	    	unset($seg['source']);
            unset($seg['target']);
	    	unset($seg['source_code']);
            unset($seg['target_code']);
            unset($seg['mime_type']);
            unset($seg['filename']);
            unset($seg['jid']);
            unset($seg['pid']);
            unset($seg['cid']);
            unset($seg['tid']);
            unset($seg['pname']);
            unset($seg['create_date']);
            unset($seg['id_segment_end']);
            unset($seg['id_segment_start']);
	    	unset($seg['last_opened_segment']);
        }

        if (empty($this->last_opened_segment)) {
            $this->last_opened_segment = getFirstSegmentId($this->jid, $this->password);
        	log::doLog($this->last_opened_segment);
        }

        $this->job_stats = CatUtils::getStatsForJob($this->jid, $this->casIsReplaying);
	if (count($files_found)==1){
		$this->downloadFileName=$files_found[0];
	}

        // CASMACAT start
        if ($this->casIsReplaying) {
            $this->initCfg = json_decode(fetchInitialConfig($this->jid, $this->fid));
            log::doLog("CASMACAT: Initial config: " . print_r($this->initCfg, true));
        }
        // CASMACAT end

    //   echo "<pre>";
    //   print_r($this->data);
    //   exit;
    }

    public function setTemplateVars() {
        $this->template->itpserver = INIT::$ITP_SERVER;
        $this->template->htrserver = INIT::$HTR_SERVER;
        $this->template->biconcorserver = INIT::$BICONCOR_SERVER;
        $this->template->jid = $this->jid;
        $this->template->password=$this->password;
        $this->template->cid = $this->cid;
        $this->template->create_date = $this->create_date;
        $this->template->pname = $this->pname;
		$this->template->pid=$this->pid;
        $this->template->tid=$this->tid;
		$this->template->source=$this->source;
		$this->template->target=$this->target;
		//$this->template->cucu=$this->open_segment;

        if (!empty($_GET["itp-server"])) {
          $this->template->itpserver = $_GET["itp-server"];
        }

        if ($this->page) {  // use this only when a value has been given. And yes, we should homogenize stuff like this ASAP!!
          // FIXME: This is a temp workaround for the pre-evaluation. We should homogenize stuff like this ASAP!
          // We reuse the $page var to indicate the CAT client configuration, since $page is actually not being used in the prototype.
          $delimiters = array(":", "@");
          foreach ($delimiters as $delim) {
            if ( strpos($this->page, $delim) !== false ) {
              break; // We have found the current delimiter
            } else {
              $delim = null;
            }
          }

          $server_url  = INIT::$ITP_SERVER; // We can't access template vars before PHPTAL populates them
          $path_parts  = explode("/", $server_url);
          $server_data = $path_parts[0];

          if ($delim) {
            list($catsetting, $portnum) = explode($delim, $this->page);
            $this->template->catsetting = $catsetting;
            if (intval($portnum) > 0) {
              if (strstr($server_url, "http://") === true) {
                $server_url = str_replace("http://", "", $server_url);
              }
              // In nginx we use the @ to change port number at runtime, otherwise we'll pass the port as usual (:)
              if (strpos($server_data, "@") !== false) {
                $server_data = preg_replace('/@[0-9]+/', $delim.$portnum, $server_data);
              } elseif (strpos($server_data, ":") !== false) {
                $server_data = preg_replace('/:[0-9]+/', $delim.$portnum, $server_data);
              }
            }
          } else {
            $this->template->catsetting = $this->page;
          }

          $path_parts[0] = $server_data;
          $this->template->itpserver = implode("/", $path_parts);

        } else {
          $this->template->catsetting = "";
        }

//		$this->template->stats=$stats[0]['TOTAL'];

		$this->template->source_code=$this->source_code;
		$this->template->target_code=$this->target_code;

        // CASMACAT extension start
        $this->template->logEnabled = INIT::$LOG_ENABLED;
        $this->template->logMaxChunkSize = INIT::$LOG_MAXCHUNKSIZE;
        $this->template->casIsReplaying = $this->casIsReplaying;
        // do this always, otherwise an error will be thrown in PHPTAL
        // when accessing template variables
        log::doLog("CASMACAT: Setting additional template variables...");
        $this->template->debug = INIT::$DEBUG;
        $this->template->itpEnabled = INIT::$ITP_ENABLED;
        $this->template->penEnabled = INIT::$PEN_ENABLED;
        $this->template->etEnabled = INIT::$ET_ENABLED;
        $this->template->etType = INIT::$ET_TYPE;
        $this->template->srEnabled = INIT::$SR_ENABLED;
        $this->template->toucheditEnabled = INIT::$TOUCHEDIT_ENABLED;
        $this->template->biconcorEnabled = INIT::$BICONCOR_ENABLED;
        $this->template->hideContributions = INIT::$HIDE_CONTRIBUTIONS;
        $this->template->floatPredictions = INIT::$FLOAT_PREDICTIONS;
        $this->template->translationOptions = INIT::$TRANSLATION_OPTIONS;
        $this->template->allowChangeVisualizationOptions = INIT::$ALLOW_CHANGE_VISUALIZATION_OPTIONS;
        $this->template->mode = INIT::$MODE;
        $this->template->itpDraftOnly = INIT::$ITP_DRAFT_ONLY;
        $this->template->displayMouseAlign = INIT::$DISPLAY_MOUSE_ALIGN;
        $this->template->displayCaretAlign = INIT::$DISPLAY_CARET_ALIGN;
        $this->template->displayShadeOffTranslatedSource = INIT::$DISPLAY_SHADE_OFF_TRANSLATED_SOURCE;
        $this->template->displayconfidences = INIT::$DISPLAY_CONFIDENCES;
        $this->template->highlightValidated = INIT::$HIGHLIGHT_VALIDATED;
        $this->template->highlightPrefix = INIT::$HIGHLIGHT_PREFIX;
        $this->template->highlightSuffix = INIT::$HIGHLIGHT_SUFFIX;
        $this->template->highlightLastValidated = INIT::$HIGHLIGHT_LAST_VALIDATED;
        $this->template->limitSuffixLength = INIT::$LIMIT_SUFFIX_LENGTH;
        log::doLog("CASMACAT: itpEnabled: " . INIT::$ITP_ENABLED);
        log::doLog("CASMACAT: etEnabled: " . INIT::$ET_ENABLED);
        if (INIT::$LOG_ENABLED) {
            log::doLog("CASMACAT: Correcting 'last_opened_segment'...");
            if ($this->casIsReplaying) {
                    $this->last_opened_segment = 0;
            }
            else if (!isset($this->last_opened_segment)) {
                    $this->last_opened_segment = "";
            }
        }

        if ($this->casIsReplaying) {
//            $this->template->fid = $this->initCfg->file_id;
//            $this->template->logEnabled = $this->initCfg->logEnabled;
//            $this->template->logMaxChunkSize = $this->initCfg->logMaxChunkSize;
//            $this->template->replay = $this->initCfg->casIsReplaying;
//            $this->template->debug = $this->initCfg->debug;
            $this->template->catsetting = $this->initCfg->catsetting;
            $this->template->itpEnabled = $this->initCfg->itpEnabled;
            $this->template->penEnabled = $this->initCfg->penEnabled;
            $this->template->etEnabled = $this->initCfg->etEnabled;
//            $this->template->etType = $this->initCfg->etType;
            $this->template->srEnabled = $this->initCfg->srEnabled;
            $this->template->toucheditEnabled = $this->initCfg->toucheditEnabled;
            $this->template->biconcorEnabled = $this->initCfg->biconcorEnabled;
            $this->template->hideContributions = $this->initCfg->hideContributions;
            $this->template->floatPredictions = $this->initCfg->floatPredictions;
			$this->template->translationOptions = $this->initCfg->translationOptions;
            // prefs
        }

        // CASMACAT extension end

  $this->template->fid = $this->fid;


		$this->template->last_opened_segment=$this->last_opened_segment;
		$this->template->data = $this->data;

		$this->template->job_stats=$this->job_stats;

		$end_time=microtime(true)*1000;
		$load_time=$end_time-$this->start_time;
		$this->template->load_time=$load_time;
		$this->template->time_to_edit_enabled = INIT::$TIME_TO_EDIT_ENABLED;
		$this->template->build_number = INIT::$BUILD_NUMBER;
		$this->template->downloadFileName=$this->downloadFileName;
		$this->template->job_not_found=$this->job_not_found;


       // echo "<pre>";
       // print_r ($this->template);
       // exit;

    }

}
?>

